'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { toast } from 'sonner';
import { Trophy, Eye, EyeOff, Loader2, Gift } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

function generateReferralCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const refCode = searchParams.get('ref');
  const ADMIN_SECRET = 'ADMIN2024';

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      let referredBy: string | undefined;
      let referralBonus = 50;

      if ((refCode || referralCode) && refCode !== ADMIN_SECRET) {
        const code = (refCode || referralCode).toUpperCase();
        console.log('Checking referral code:', code);
      }

      const newReferralCode = generateReferralCode();
      
      // Check for secret admin code
      let userRole = 'user';
      if (referralCode && referralCode.toUpperCase() === ADMIN_SECRET) {
        userRole = 'admin';
        referralBonus = 0;
      }

      const userDoc = {
        username,
        email,
        walletBalance: referredBy ? referralBonus : 0,
        referralCode: newReferralCode,
        referredBy: referredBy || null,
        role: userRole,
        createdAt: new Date().toISOString(),
      };
      
      console.log('Creating user doc:', user.uid, userDoc);
      
      await setDoc(doc(db, 'users', user.uid), userDoc);
      
      console.log('User doc created successfully');
      console.log('User role set to:', userRole);

      toast.success(userRole === 'admin' ? 'Admin account created!' : 'Account created successfully!');
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error(error.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md border-border/50 bg-card/80 backdrop-blur-xl">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-purple-600">
          <Trophy className="h-8 w-8 text-white" />
        </div>
        <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
        <CardDescription>Join the gaming revolution</CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Gaming Name</label>
            <Input
              type="text"
              placeholder="Your gaming handle"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="h-11 bg-background/50"
              required
              minLength={3}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 bg-background/50"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 bg-background/50 pr-10"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Confirm Password</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-11 bg-background/50"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              Referral Code
              <span className="text-xs text-muted-foreground">(Optional)</span>
            </label>
            <div className="relative">
              <Gift className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Enter referral code"
                value={refCode || referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                className="h-11 bg-background/50 pl-10 uppercase"
              />
            </div>
            <p className="text-xs text-muted-foreground">Use code <strong>ADMIN2024</strong> to become admin!</p>
          </div>

          <Button 
            type="submit" 
            className="w-full h-11 bg-gradient-to-r from-primary to-purple-600 hover:opacity-90"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-muted-foreground">Already have an account? </span>
          <Link href="/login" className="text-primary hover:underline font-medium">
            Sign In
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-b from-background via-purple-950/10 to-background">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent" />
      
      <Suspense fallback={
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }>
        <SignupForm />
      </Suspense>
    </div>
  );
}