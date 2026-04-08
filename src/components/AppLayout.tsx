'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Notifications from '@/components/Notifications';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      <Notifications />
    </>
  );
}