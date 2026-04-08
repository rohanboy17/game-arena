'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useNotification } from '@/lib/notification-context';
import { DepositRequest } from '@/types';
import { getDocuments, updateDocument, COLLECTIONS } from '@/lib/db';
import { db } from '@/lib/firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';

export default function AdminDepositsPage() {
  const router = useRouter();
  const { user, userData, loading: authLoading } = useAuth();
  const { addNotification } = useNotification();
  
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    if (!authLoading && (!user || !userData?.isAdmin)) {
      router.push('/');
    }
  }, [user, userData, authLoading, router]);

  useEffect(() => {
    if (user && userData?.isAdmin) {
      loadDeposits();
    }
  }, [user, userData]);

  const loadDeposits = async () => {
    try {
      const data = await getDocuments<DepositRequest>(COLLECTIONS.DEPOSITS);
      setDeposits(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error('Error loading deposits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (deposit: DepositRequest) => {
    try {
      await updateDocument(COLLECTIONS.DEPOSITS, deposit.id, { status: 'approved' });
      
      const userRef = doc(db, 'users', deposit.userId);
      await updateDoc(userRef, {
        walletBalance: increment(deposit.amount),
      });

      addNotification('Deposit approved!', 'success');
      loadDeposits();
    } catch (error) {
      console.error('Error approving deposit:', error);
      addNotification('Failed to approve deposit', 'error');
    }
  };

  const handleReject = async (deposit: DepositRequest) => {
    if (!confirm('Are you sure you want to reject this deposit request?')) return;
    
    try {
      await updateDocument(COLLECTIONS.DEPOSITS, deposit.id, { status: 'rejected' });
      addNotification('Deposit rejected', 'success');
      loadDeposits();
    } catch (error) {
      console.error('Error rejecting deposit:', error);
      addNotification('Failed to reject deposit', 'error');
    }
  };

  const filteredDeposits = deposits.filter(d => {
    if (filter === 'all') return true;
    return d.status === filter;
  });

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user || !userData?.isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-primary hover:underline">← Back</Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Deposit Requests</h1>
              <p className="text-muted">{deposits.filter(d => d.status === 'pending').length} pending</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-2 mb-6">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === f
                  ? 'bg-primary text-white'
                  : 'bg-card text-muted hover:text-foreground'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {filteredDeposits.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-xl border border-border">
            <p className="text-muted">No deposit requests</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDeposits.map((deposit) => (
              <div key={deposit.id} className="bg-card border border-border rounded-xl p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-foreground">{deposit.username}</h3>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          deposit.status === 'approved'
                            ? 'bg-green-600/20 text-green-400'
                            : deposit.status === 'rejected'
                            ? 'bg-red-600/20 text-red-400'
                            : 'bg-yellow-600/20 text-yellow-400'
                        }`}
                      >
                        {deposit.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-primary">₹{deposit.amount}</p>
                    <p className="text-sm text-muted mt-1">
                      {new Date(deposit.createdAt).toLocaleString()}
                    </p>
                  </div>

                  {deposit.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(deposit)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(deposit)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  {deposit.screenshotURL && (
                    <a
                      href={deposit.screenshotURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-secondary/20 text-secondary rounded-lg font-medium hover:bg-secondary hover:text-white transition-colors"
                    >
                      View Screenshot
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}