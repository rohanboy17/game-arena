'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  Wallet, 
  CreditCard, 
  Upload, 
  Copy, 
  CheckCircle, 
  Loader2,
  ArrowUpRight,
  ArrowDownLeft,
  Building,
  Smartphone,
  Image as ImageIcon
} from 'lucide-react';
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
  
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [amount, setAmount] = useState('');
  const [upiId, setUpiId] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'withdraw') setActiveTab('withdraw');
  }, [searchParams]);

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }
    setScreenshot(file);
    const reader = new FileReader();
    reader.onloadend = () => setScreenshotPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !screenshot) return;

    const depositAmount = parseFloat(amount);
    if (depositAmount < 50) {
      toast.error('Minimum deposit is ₹50');
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

      toast.success('Deposit request submitted! Pending approval.');
      setAmount('');
      setScreenshot(null);
      setScreenshotPreview(null);
      fileInputRef.current!.value = '';
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to submit deposit');
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const withdrawAmount = parseFloat(amount);
    if (withdrawAmount < 100) {
      toast.error('Minimum withdrawal is ₹100');
      return;
    }
    if (withdrawAmount > (userData?.walletBalance || 0)) {
      toast.error('Insufficient balance');
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
        description: `Withdrawal to ${upiId}`,
        createdAt: new Date().toISOString(),
      });

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { walletBalance: increment(-withdrawAmount) });

      toast.success('Withdrawal request submitted!');
      setAmount('');
      setUpiId('');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to submit withdrawal');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !userData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-purple-950/5 to-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Wallet</h1>

        {/* Balance Card */}
        <Card className="mb-6 border-border/50 bg-gradient-to-br from-primary/20 via-purple-600/20 to-primary/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Available Balance</p>
                <p className="text-4xl font-bold text-primary">₹{userData.walletBalance.toFixed(2)}</p>
              </div>
              <div className="h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center">
                <Wallet className="h-8 w-8 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === 'deposit' ? 'default' : 'outline'}
            className={activeTab === 'deposit' ? 'bg-gradient-to-r from-primary to-purple-600' : ''}
            onClick={() => setActiveTab('deposit')}
          >
            <ArrowDownLeft className="mr-2 h-4 w-4" />
            Add Money
          </Button>
          <Button
            variant={activeTab === 'withdraw' ? 'default' : 'outline'}
            className={activeTab === 'withdraw' ? 'bg-gradient-to-r from-primary to-purple-600' : ''}
            onClick={() => setActiveTab('withdraw')}
          >
            <ArrowUpRight className="mr-2 h-4 w-4" />
            Withdraw
          </Button>
        </div>

        {activeTab === 'deposit' && (
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Add Money</CardTitle>
              <CardDescription>Transfer via UPI and upload payment screenshot</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Instructions */}
              <div className="rounded-lg bg-primary/10 p-4 border border-primary/20">
                <h3 className="font-semibold text-primary mb-2">How to Add Money</h3>
                <ol className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-white">1</span>
                    Copy the UPI ID below
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-white">2</span>
                    Open your UPI app (GPay, PhonePe, Paytm)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-white">3</span>
                    Send the amount to our UPI ID
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-white">4</span>
                    Upload the payment screenshot below
                  </li>
                </ol>
              </div>

              {/* UPI Details */}
              <div className="rounded-lg bg-card p-4 border border-border/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">UPI ID</p>
                    <p className="text-lg font-bold">{DEFAULT_UPI_ID}</p>
                    <p className="text-sm text-muted-foreground">Pay to: {DEFAULT_UPI_NAME}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => {
                    navigator.clipboard.writeText(DEFAULT_UPI_ID);
                    toast.success('UPI ID copied!');
                  }}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <form onSubmit={handleDeposit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Amount (₹)</Label>
                  <Input
                    type="number"
                    placeholder="Enter amount (min ₹50)"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="h-11"
                    required
                    min="50"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Payment Screenshot</Label>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleScreenshotChange}
                      className="hidden"
                      id="screenshot"
                    />
                    <label htmlFor="screenshot" className="cursor-pointer">
                      {screenshotPreview ? (
                        <img src={screenshotPreview} alt="Preview" className="max-h-40 mx-auto rounded-lg" />
                      ) : (
                        <>
                          <ImageIcon className="mx-auto h-10 w-10 text-muted-foreground" />
                          <p className="mt-2 text-sm text-muted-foreground">Click to upload screenshot</p>
                        </>
                      )}
                    </label>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-11 bg-gradient-to-r from-primary to-purple-600"
                  disabled={submitting || !screenshot}
                >
                  {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</> : 'Submit Request'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {activeTab === 'withdraw' && (
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Withdraw Money</CardTitle>
              <CardDescription>Request withdrawal to your UPI ID</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg bg-yellow-500/10 p-4 border border-yellow-500/20">
                <p className="text-sm text-yellow-500">
                  <strong>Note:</strong> Withdrawals are processed manually. Minimum withdrawal is ₹100.
                </p>
              </div>

              <form onSubmit={handleWithdraw} className="space-y-4">
                <div className="space-y-2">
                  <Label>UPI ID</Label>
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="yourname@upi"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="h-11 pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Amount (₹)</Label>
                  <Input
                    type="number"
                    placeholder="Enter amount (min ₹100)"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="h-11"
                    required
                    min="100"
                  />
                  <p className="text-sm text-muted-foreground">Available: ₹{userData.walletBalance.toFixed(2)}</p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-11 bg-gradient-to-r from-primary to-purple-600"
                  disabled={submitting}
                >
                  {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</> : 'Request Withdrawal'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function WalletPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <WalletContent />
    </Suspense>
  );
}