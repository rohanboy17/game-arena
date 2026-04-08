'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useNotification } from '@/lib/notification-context';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, db } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, increment } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

const DEFAULT_UPI_ID = 'gamearena@upi';
const DEFAULT_UPI_NAME = 'GameArena';

function WalletContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, userData, loading } = useAuth();
  const { addNotification } = useNotification();
  
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [amount, setAmount] = useState('');
  const [upiId, setUpiId] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'withdraw') {
      setActiveTab('withdraw');
    }
  }, [searchParams]);

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        addNotification('File size must be less than 5MB', 'error');
        return;
      }
      setScreenshot(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !screenshot) return;

    const depositAmount = parseFloat(amount);
    if (depositAmount < 50) {
      addNotification('Minimum deposit amount is ₹50', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const screenshotId = uuidv4();
      const screenshotRef = ref(storage, `deposits/${user.uid}/${screenshotId}`);
      await uploadBytes(screenshotRef, screenshot);
      const screenshotURL = await getDownloadURL(screenshotRef);

      await addDoc(collection(db, 'depositRequests'), {
        userId: user.uid,
        username: userData?.username,
        amount: depositAmount,
        screenshotURL,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });

      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        type: 'deposit',
        amount: depositAmount,
        status: 'pending',
        description: `Deposit request for ₹${depositAmount}`,
        createdAt: new Date().toISOString(),
      });

      addNotification('Deposit request submitted! Waiting for approval.', 'success');
      setAmount('');
      setScreenshot(null);
      setScreenshotPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Deposit error:', error);
      addNotification('Failed to submit deposit request', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const withdrawAmount = parseFloat(amount);
    if (withdrawAmount < 100) {
      addNotification('Minimum withdrawal amount is ₹100', 'error');
      return;
    }

    if (withdrawAmount > (userData?.walletBalance || 0)) {
      addNotification('Insufficient wallet balance', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'withdrawRequests'), {
        userId: user.uid,
        username: userData?.username,
        amount: withdrawAmount,
        upiId,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });

      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        type: 'withdrawal',
        amount: withdrawAmount,
        status: 'pending',
        description: `Withdrawal request to ${upiId}`,
        createdAt: new Date().toISOString(),
      });

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        walletBalance: increment(-withdrawAmount),
      });

      addNotification('Withdrawal request submitted!', 'success');
      setAmount('');
      setUpiId('');
    } catch (error) {
      console.error('Withdraw error:', error);
      addNotification('Failed to submit withdrawal request', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !userData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Wallet</h1>
          <p className="text-muted">Manage your funds</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted uppercase tracking-wider">Available Balance</p>
              <p className="text-4xl font-bold text-primary">₹{userData.walletBalance.toFixed(2)}</p>
            </div>
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">₹</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('deposit')}
            className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'deposit'
                ? 'bg-primary text-white'
                : 'bg-card text-muted hover:text-foreground'
            }`}
          >
            Add Money
          </button>
          <button
            onClick={() => setActiveTab('withdraw')}
            className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'withdraw'
                ? 'bg-primary text-white'
                : 'bg-card text-muted hover:text-foreground'
            }`}
          >
            Withdraw
          </button>
        </div>

        {activeTab === 'deposit' && (
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-xl font-bold text-foreground mb-6">Add Money</h2>
            
            <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-primary mb-2">Payment Instructions</h3>
              <ol className="text-sm text-foreground space-y-2">
                <li>1. Copy the UPI ID below</li>
                <li>2. Open your UPI app (GPay, PhonePe, Paytm)</li>
                <li>3. Send the amount to our UPI ID</li>
                <li>4. Upload the payment screenshot below</li>
                <li>5. Wait for admin approval (usually within 24 hours)</li>
              </ol>
            </div>

            <div className="bg-background rounded-lg p-4 mb-6">
              <p className="text-sm text-muted mb-1">UPI ID</p>
              <div className="flex items-center justify-between">
                <p className="text-lg font-bold text-foreground">{DEFAULT_UPI_ID}</p>
                <button
                  onClick={() => navigator.clipboard.writeText(DEFAULT_UPI_ID)}
                  className="px-3 py-1 bg-primary/20 text-primary rounded text-sm font-medium hover:bg-primary hover:text-white transition-colors"
                >
                  Copy
                </button>
              </div>
              <p className="text-sm text-muted mt-2">Pay to: {DEFAULT_UPI_NAME}</p>
            </div>

            <form onSubmit={handleDeposit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                  placeholder="Enter amount (min ₹50)"
                  required
                  min="50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Payment Screenshot
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleScreenshotChange}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-white file:cursor-pointer"
                  required
                />
                {screenshotPreview && (
                  <div className="mt-4">
                    <img
                      src={screenshotPreview}
                      alt="Screenshot preview"
                      className="max-h-48 rounded-lg border border-border"
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting || !screenshot}
                className="w-full py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'withdraw' && (
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-xl font-bold text-foreground mb-6">Withdraw Money</h2>

            <div className="bg-accent/10 border border-accent/30 rounded-lg p-4 mb-6">
              <p className="text-sm text-foreground">
                <span className="font-semibold text-accent">Note:</span> Withdrawals are processed manually by admin. 
                Minimum withdrawal is ₹100.
              </p>
            </div>

            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  UPI ID
                </label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                  placeholder="yourname@upi"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                  placeholder="Enter amount (min ₹100)"
                  required
                  min="100"
                />
                <p className="text-xs text-muted mt-1">
                  Available: ₹{userData.walletBalance.toFixed(2)}
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Request Withdrawal'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default function WalletPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <WalletContent />
    </Suspense>
  );
}