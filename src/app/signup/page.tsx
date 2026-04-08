'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useNotification } from '@/lib/notification-context';
import { v4 as uuidv4 } from 'uuid';

function generateReferralCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function SignupForm() {
  const searchParams = useSearchParams();
  const { addNotification } = useNotification();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      setReferralCode(ref);
    }
  }, [searchParams]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      addNotification('Passwords do not match', 'error');
      return;
    }

    if (password.length < 6) {
      addNotification('Password must be at least 6 characters', 'error');
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      let referredBy: string | undefined;
      let referralBonus = 0;

      if (referralCode) {
        const usersRef = doc(db, 'users');
        const snapshot = await getDoc(usersRef);
        if (snapshot.exists()) {
          const users = snapshot.data();
          const referrer = Object.values(users).find((u: any) => u.referralCode === referralCode);
          if (referrer) {
            referredBy = (referrer as any).id;
            referralBonus = 50;
          }
        }
      }

      const newReferralCode = generateReferralCode();

      await setDoc(doc(db, 'users', user.uid), {
        username,
        email,
        walletBalance: referralBonus,
        referralCode: newReferralCode,
        referredBy: referredBy || null,
        createdAt: new Date().toISOString(),
        isAdmin: false,
      });

      if (referredBy) {
        await setDoc(doc(db, 'transactions', uuidv4()), {
          userId: referredBy,
          type: 'referral',
          amount: referralBonus,
          status: 'completed',
          description: `Referral bonus from ${username}`,
          createdAt: new Date().toISOString(),
        });
      }

      addNotification('Account created successfully!', 'success');
    } catch (error: any) {
      console.error('Signup error:', error);
      addNotification(error.message || 'Signup failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSignup} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Gaming Name
        </label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-4 py-3 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
          placeholder="Your gaming name"
          required
          minLength={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Email Address
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
          placeholder="you@example.com"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
          placeholder="••••••••"
          required
          minLength={6}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Confirm Password
        </label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full px-4 py-3 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
          placeholder="••••••••"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Referral Code <span className="text-muted">(optional)</span>
        </label>
        <input
          type="text"
          value={referralCode}
          onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
          className="w-full px-4 py-3 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:border-primary uppercase"
          placeholder="Enter referral code"
        />
        <p className="text-xs text-muted mt-1">Get ₹50 bonus when you use a referral code!</p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            Creating account...
          </span>
        ) : (
          'Create Account'
        )}
      </button>
    </form>
  );
}

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl gaming-gradient flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-3xl">G</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground">Create Account</h1>
          <p className="text-muted mt-2">Join GameArena and start competing</p>
        </div>

        <Suspense fallback={
          <div className="flex items-center justify-center py-12">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        }>
          <SignupForm />
        </Suspense>

        <p className="text-center text-muted mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}