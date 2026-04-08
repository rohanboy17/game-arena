'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useNotification } from '@/lib/notification-context';
import { WithdrawRequest } from '@/types';
import { getDocuments, updateDocument, COLLECTIONS } from '@/lib/db';

export default function AdminWithdrawalsPage() {
  const router = useRouter();
  const { user, userData, loading: authLoading } = useAuth();
  const { addNotification } = useNotification();
  
  const [withdrawals, setWithdrawals] = useState<WithdrawRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    if (!authLoading && (!user || !userData?.isAdmin)) {
      router.push('/');
    }
  }, [user, userData, authLoading, router]);

  useEffect(() => {
    if (user && userData?.isAdmin) {
      loadWithdrawals();
    }
  }, [user, userData]);

  const loadWithdrawals = async () => {
    try {
      const data = await getDocuments<WithdrawRequest>(COLLECTIONS.WITHDRAWALS);
      setWithdrawals(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error('Error loading withdrawals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (withdrawal: WithdrawRequest) => {
    if (!confirm(`Confirm payment of ₹${withdrawal.amount} to ${withdrawal.upiId}?`)) return;
    
    try {
      await updateDocument(COLLECTIONS.WITHDRAWALS, withdrawal.id, { status: 'approved' });
      addNotification('Withdrawal marked as paid!', 'success');
      loadWithdrawals();
    } catch (error) {
      console.error('Error approving withdrawal:', error);
      addNotification('Failed to approve withdrawal', 'error');
    }
  };

  const handleReject = async (withdrawal: WithdrawRequest) => {
    if (!confirm('Are you sure you want to reject this withdrawal request? The amount will be refunded to the user.')) return;
    
    try {
      await updateDocument(COLLECTIONS.WITHDRAWALS, withdrawal.id, { status: 'rejected' });
      addNotification('Withdrawal rejected', 'success');
      loadWithdrawals();
    } catch (error) {
      console.error('Error rejecting withdrawal:', error);
      addNotification('Failed to reject withdrawal', 'error');
    }
  };

  const filteredWithdrawals = withdrawals.filter(w => {
    if (filter === 'all') return true;
    return w.status === filter;
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
              <h1 className="text-2xl font-bold text-foreground">Withdrawal Requests</h1>
              <p className="text-muted">{withdrawals.filter(w => w.status === 'pending').length} pending</p>
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

        {filteredWithdrawals.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-xl border border-border">
            <p className="text-muted">No withdrawal requests</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredWithdrawals.map((withdrawal) => (
              <div key={withdrawal.id} className="bg-card border border-border rounded-xl p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-foreground">{withdrawal.username}</h3>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          withdrawal.status === 'approved'
                            ? 'bg-green-600/20 text-green-400'
                            : withdrawal.status === 'rejected'
                            ? 'bg-red-600/20 text-red-400'
                            : 'bg-yellow-600/20 text-yellow-400'
                        }`}
                      >
                        {withdrawal.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-accent">₹{withdrawal.amount}</p>
                    <p className="text-sm text-muted mt-1">
                      UPI: {withdrawal.upiId}
                    </p>
                    <p className="text-sm text-muted">
                      {new Date(withdrawal.createdAt).toLocaleString()}
                    </p>
                  </div>

                  {withdrawal.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(withdrawal)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                      >
                        Mark as Paid
                      </button>
                      <button
                        onClick={() => handleReject(withdrawal)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
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