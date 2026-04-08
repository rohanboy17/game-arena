'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { 
  Trophy, 
  Wallet, 
  Users, 
  Gamepad2, 
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const { user, userData, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  const NavLink = ({ href, children, icon: Icon }: { href: string; children: React.ReactNode; icon?: any }) => (
    <Link
      href={href}
      className={`flex items-center gap-2 text-sm font-medium transition-all ${
        isActive(href) 
          ? 'text-primary' 
          : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </Link>
  );

  const navLinks = [
    { href: '/', label: 'Home', icon: Trophy },
  ];

  if (user) {
    navLinks.push({ href: '/tournaments', label: 'Tournaments', icon: Gamepad2 });
    navLinks.push({ href: '/dashboard', label: 'Dashboard', icon: Gamepad2 });
    navLinks.push({ href: '/wallet', label: 'Wallet', icon: Wallet });
  }

  if (userData?.role === 'manager') {
    navLinks.push({ href: '/manager', label: 'Manager', icon: Users });
  }

  if (userData?.role === 'admin') {
    navLinks.push({ href: '/admin', label: 'Admin', icon: Users });
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-purple-600">
            <Trophy className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
            GameArena
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <NavLink key={link.href} href={link.href} icon={link.icon}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-full bg-secondary/10 px-3 py-1.5">
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-sm font-bold text-white">
                  {userData?.username?.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium">₹{userData?.walletBalance?.toFixed(0) || 0}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-gradient-to-r from-primary to-purple-600 hover:opacity-90">Sign Up</Button>
              </Link>
            </>
          )}
        </div>

        <button
          className="md:hidden p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background/95 backdrop-blur-xl p-4 space-y-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-2 text-sm font-medium py-2 ${
                isActive(link.href) ? 'text-primary' : 'text-muted-foreground'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.icon && <link.icon className="w-4 h-4" />}
              {link.label}
            </Link>
          ))}
          <div className="flex gap-2 pt-2 border-t">
            {user ? (
              <Button variant="outline" className="flex-1" onClick={signOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            ) : (
              <>
                <Link href="/login" className="flex-1">
                  <Button variant="outline" className="w-full">Login</Button>
                </Link>
                <Link href="/signup" className="flex-1">
                  <Button className="w-full bg-gradient-to-r from-primary to-purple-600">Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}