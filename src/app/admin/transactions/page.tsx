'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Transaction } from '@/types';
import { getDocuments, COLLECTIONS } from '@/lib/db';

export default function AdminTransactionsPage() {
  const router = useRouter();
  const { user, userData, loading: authLoading } = useAuth();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'deposit' | 'withdrawal' | 'entry' | 'winning'>('all');

  useEffect(() => {
    if (!authLoading && (!user || !userData?.isAdmin)) {
      router.push('/');
    }
  }, [user, userData, authLoading, router]);

  useEffect(() => {
    if (user && userData?.isAdmin) {
      loadTransactions();
    }
  }, [user, userData]);

  const loadTransactions = async () => {
    try {
      const data = await getDocuments<Transaction>(COLLECTIONS.TRANSACTIONS);
      setTransactions(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(t => {
    if (filter === 'all') return true;
    return t.type === filter;
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
              <h1 className="text-2xl font-bold text-foreground">All Transactions</h1>
              <p className="text-muted">{transactions.length} total transactions</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-2 mb-6">
          {(['all', 'deposit', 'withdrawal', 'entry', 'winning'] as const).map((f) => (
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

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-background">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">User ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Description</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 text-xs rounded-full bg-primary/20 text-primary capitalize">
                      {tx.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted text-sm font-mono">{tx.userId.slice(0, 8)}...</td>
                  <td className={`px-4 py-3 font-medium ${tx.type === 'withdrawal' || tx.type === 'entry' ? 'text-red-400' : 'text-green-400'}`}>
                    {tx.type === 'withdrawal' || tx.type === 'entry' ? '-' : '+'}₹{tx.amount}
                  </td>
                  <td className="px-4 py-3 text-foreground text-sm">{tx.description}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        tx.status === 'completed'
                          ? 'bg-green-600/20 text-green-400'
                          : tx.status === 'failed'
                          ? 'bg-red-600/20 text-red-400'
                          : 'bg-yellow-600/20 text-yellow-400'
                      }`}
                    >
                      {tx.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted text-sm">
                    {new Date(tx.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}