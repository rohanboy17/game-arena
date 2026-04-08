'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg gaming-gradient flex items-center justify-center">
                <span className="text-white font-bold">G</span>
              </div>
              <span className="text-lg font-bold text-foreground">GameArena</span>
            </div>
            <p className="text-sm text-muted">
              Skill-based eSports tournaments with real prizes. Compete, win, and earn!
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Quick Links</h3>
            <div className="flex flex-col gap-2">
              <Link href="/" className="text-sm text-muted hover:text-primary transition-colors">
                Tournaments
              </Link>
              <Link href="/dashboard" className="text-sm text-muted hover:text-primary transition-colors">
                Dashboard
              </Link>
              <Link href="/wallet" className="text-sm text-muted hover:text-primary transition-colors">
                Wallet
              </Link>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Legal</h3>
            <div className="flex flex-col gap-2">
              <Link href="/terms" className="text-sm text-muted hover:text-primary transition-colors">
                Terms & Conditions
              </Link>
              <Link href="/privacy" className="text-sm text-muted hover:text-primary transition-colors">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8">
          <p className="text-xs text-muted text-center">
            This platform hosts skill-based eSports tournaments and is not affiliated with any game publisher. 
            No gambling is involved. All tournaments are based on skill and fair play.
          </p>
          <p className="text-xs text-muted text-center mt-2">
            © {new Date().getFullYear()} GameArena. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}