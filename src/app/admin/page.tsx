'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { User, Tournament, DepositRequest, WithdrawRequest, Result } from '@/types';
import { getDocuments, COLLECTIONS } from '@/lib/db';
import { collection, getCountFromServer } from 'firebase/firestore';

interface DashboardStats {
  totalUsers: number;
  totalTournaments: number;
  activeTournaments: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
  pendingResults: number;
  totalRevenue: number;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, userData, loading: authLoading } = useAuth();
  
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalTournaments: 0,
    activeTournaments: 0,
    pendingDeposits: 0,
    pendingWithdrawals: 0,
    pendingResults: 0,
    totalRevenue: 0,
  });
  const [recentDeposits, setRecentDeposits] = useState<DepositRequest[]>([]);
  const [recentWithdrawals, setRecentWithdrawals] = useState<WithdrawRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || !userData?.isAdmin)) {
      router.push('/');
    }
  }, [user, userData, authLoading, router]);

  useEffect(() => {
    if (user && userData?.isAdmin) {
      loadDashboardData();
    }
  }, [user, userData]);

  const loadDashboardData = async () => {
    try {
      const [users, tournaments, deposits, withdrawals, results] = await Promise.all([
        getDocuments<User>(COLLECTIONS.USERS),
        getDocuments<Tournament>(COLLECTIONS.TOURNAMENTS),
        getDocuments<DepositRequest>(COLLECTIONS.DEPOSITS),
        getDocuments<WithdrawRequest>(COLLECTIONS.WITHDRAWALS),
        getDocuments<Result>(COLLECTIONS.RESULTS),
      ]);

      const pendingDeposits = deposits.filter(d => d.status === 'pending');
      const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending');
      const pendingResults = results.filter(r => r.status === 'pending');

      setStats({
        totalUsers: users.length,
        totalTournaments: tournaments.length,
        activeTournaments: tournaments.filter(t => t.status === 'upcoming' || t.status === 'live').length,
        pendingDeposits: pendingDeposits.length,
        pendingWithdrawals: pendingWithdrawals.length,
        pendingResults: pendingResults.length,
        totalRevenue: users.reduce((sum, u) => sum + (u.walletBalance || 0), 0),
      });

      setRecentDeposits(pendingDeposits.slice(0, 5));
      setRecentWithdrawals(pendingWithdrawals.slice(0, 5));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted">Manage your platform</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted uppercase">Total Users</p>
            <p className="text-3xl font-bold text-foreground">{stats.totalUsers}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted uppercase">Active Tournaments</p>
            <p className="text-3xl font-bold text-foreground">{stats.activeTournaments}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted uppercase">Pending Deposits</p>
            <p className="text-3xl font-bold text-primary">{stats.pendingDeposits}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted uppercase">Pending Withdrawals</p>
            <p className="text-3xl font-bold text-accent">{stats.pendingWithdrawals}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">Pending Deposits</h2>
              <Link href="/admin/deposits" className="text-sm text-primary hover:underline">
                View All
              </Link>
            </div>
            {recentDeposits.length === 0 ? (
              <p className="text-muted text-sm">No pending deposits</p>
            ) : (
              <div className="space-y-3">
                {recentDeposits.map((deposit) => (
                  <div key={deposit.id} className="flex items-center justify-between bg-background rounded-lg p-3">
                    <div>
                      <p className="font-medium text-foreground">{deposit.username}</p>
                      <p className="text-sm text-muted">₹{deposit.amount}</p>
                    </div>
                    <span className="px-2 py-1 text-xs rounded-full bg-yellow-600/20 text-yellow-400">
                      PENDING
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">Pending Withdrawals</h2>
              <Link href="/admin/withdrawals" className="text-sm text-primary hover:underline">
                View All
              </Link>
            </div>
            {recentWithdrawals.length === 0 ? (
              <p className="text-muted text-sm">No pending withdrawals</p>
            ) : (
              <div className="space-y-3">
                {recentWithdrawals.map((withdrawal) => (
                  <div key={withdrawal.id} className="flex items-center justify-between bg-background rounded-lg p-3">
                    <div>
                      <p className="font-medium text-foreground">{withdrawal.username}</p>
                      <p className="text-sm text-muted">₹{withdrawal.amount} → {withdrawal.upiId}</p>
                    </div>
                    <span className="px-2 py-1 text-xs rounded-full bg-yellow-600/20 text-yellow-400">
                      PENDING
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <Link
            href="/admin/users"
            className="bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-colors"
          >
            <p className="text-sm text-muted">Manage Users</p>
            <p className="text-lg font-bold text-foreground">→</p>
          </Link>
          <Link
            href="/admin/tournaments"
            className="bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-colors"
          >
            <p className="text-sm text-muted">Manage Tournaments</p>
            <p className="text-lg font-bold text-foreground">→</p>
          </Link>
          <Link
            href="/admin/deposits"
            className="bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-colors"
          >
            <p className="text-sm text-muted">Deposit Requests</p>
            <p className="text-lg font-bold text-foreground">{stats.pendingDeposits}</p>
          </Link>
          <Link
            href="/admin/withdrawals"
            className="bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-colors"
          >
            <p className="text-sm text-muted">Withdrawal Requests</p>
            <p className="text-lg font-bold text-foreground">{stats.pendingWithdrawals}</p>
          </Link>
          <Link
            href="/admin/results"
            className="bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-colors"
          >
            <p className="text-sm text-muted">Match Results</p>
            <p className="text-lg font-bold text-foreground">{stats.pendingResults}</p>
          </Link>
          <Link
            href="/admin/transactions"
            className="bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-colors"
          >
            <p className="text-sm text-muted">Transactions</p>
            <p className="text-lg font-bold text-foreground">→</p>
          </Link>
        </div>
      </div>
    </div>
  );
}