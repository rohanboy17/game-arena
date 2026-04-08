'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function Navbar() {
  const pathname = usePathname();
  const { user, userData } = useAuth();

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg gaming-gradient flex items-center justify-center">
              <span className="text-white font-bold text-xl">G</span>
            </div>
            <span className="text-xl font-bold text-foreground">GameArena</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className={`text-sm font-medium transition-colors ${
                isActive('/') && !isActive('/dashboard') && !isActive('/admin')
                  ? 'text-primary'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              Tournaments
            </Link>
            
            {user && (
              <>
                <Link
                  href="/dashboard"
                  className={`text-sm font-medium transition-colors ${
                    isActive('/dashboard')
                      ? 'text-primary'
                      : 'text-muted hover:text-foreground'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/wallet"
                  className={`text-sm font-medium transition-colors ${
                    isActive('/wallet')
                      ? 'text-primary'
                      : 'text-muted hover:text-foreground'
                  }`}
                >
                  Wallet
                </Link>
              </>
            )}

            {userData?.isAdmin && (
              <Link
                href="/admin"
                className={`text-sm font-medium transition-colors ${
                  isActive('/admin')
                    ? 'text-primary'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                Admin
              </Link>
            )}
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-foreground">{userData?.username}</p>
                  <p className="text-xs text-muted">₹{userData?.walletBalance?.toFixed(2) || '0.00'}</p>
                </div>
                <Link
                  href="/dashboard"
                  className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold"
                >
                  {userData?.username?.charAt(0).toUpperCase() || 'U'}
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="text-sm font-medium text-muted hover:text-foreground transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}