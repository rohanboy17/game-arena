'use client';

import Navbar from '@/components/Navbar';
import { Toaster } from '@/components/ui/sonner';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="flex-1 min-h-screen">
        {children}
      </main>
      <Footer />
      <Toaster position="top-right" />
    </>
  );
}

function Footer() {
  return (
    <footer className="border-t bg-card/50">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-purple-600">
                <span className="text-white font-bold">G</span>
              </div>
              <span className="text-lg font-bold">GameArena</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Skill-based eSports tournaments with real rewards. Compete, win, and earn!
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-4">Quick Links</h3>
            <div className="flex flex-col gap-2">
              <Link href="/tournaments" className="text-sm text-muted-foreground hover:text-primary">Tournaments</Link>
              <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-primary">Dashboard</Link>
              <Link href="/wallet" className="text-sm text-muted-foreground hover:text-primary">Wallet</Link>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-4">Legal</h3>
            <div className="flex flex-col gap-2">
              <Link href="/terms" className="text-sm text-muted-foreground hover:text-primary">Terms & Conditions</Link>
              <Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary">Privacy Policy</Link>
            </div>
          </div>
        </div>

        <div className="border-t mt-8 pt-8">
          <p className="text-xs text-muted-foreground text-center">
            This platform hosts skill-based eSports tournaments and is not affiliated with any game publisher. 
            No gambling is involved. All tournaments are based on skill and fair play.
          </p>
          <p className="text-xs text-muted-foreground text-center mt-2">
            © {new Date().getFullYear()} GameArena. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

import Link from 'next/link';