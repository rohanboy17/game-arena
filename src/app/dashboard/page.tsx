'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Tournament, Result, Transaction } from '@/types';
import { getDocuments, COLLECTIONS } from '@/lib/db';

export default function DashboardPage() {
  const router = useRouter();
  const { user, userData, loading } = useAuth();
  const [myTournaments, setMyTournaments] = useState<Tournament[]>([]);
  const [myResults, setMyResults] = useState<Result[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<'tournaments' | 'results' | 'transactions'>('tournaments');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      const tournaments = await getDocuments<Tournament>(COLLECTIONS.TOURNAMENTS);
      const joined = tournaments.filter((t) => t.joinedUsers?.includes(user!.uid));
      setMyTournaments(joined);

      const results = await getDocuments<Result>(
        COLLECTIONS.RESULTS,
      );
      setMyResults(results.filter((r) => r.userId === user?.uid));

      const txs = await getDocuments<Transaction>(
        COLLECTIONS.TRANSACTIONS,
      );
      setTransactions(txs.filter((t) => t.userId === user?.uid));
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user || !userData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-2xl">
                {userData.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{userData.username}</h1>
                <p className="text-muted">{userData.email}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="bg-background rounded-lg p-4 border border-border">
                <p className="text-xs text-muted uppercase tracking-wider">Wallet Balance</p>
                <p className="text-2xl font-bold text-primary">₹{userData.walletBalance.toFixed(2)}</p>
              </div>
              <div className="bg-background rounded-lg p-4 border border-border">
                <p className="text-xs text-muted uppercase tracking-wider">Referral Code</p>
                <p className="text-lg font-bold text-accent">{userData.referralCode}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <Link
              href="/wallet"
              className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
            >
              Add Money
            </Link>
            <Link
              href="/wallet?tab=withdraw"
              className="px-4 py-2 bg-secondary text-white rounded-lg font-medium hover:opacity-90 transition-colors"
            >
              Withdraw
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-2 mb-6">
          {(['tournaments', 'results', 'transactions'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-primary text-white'
                  : 'bg-card text-muted hover:text-foreground'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === 'tournaments' && (
          <div>
            <h2 className="text-xl font-bold text-foreground mb-4">My Tournaments</h2>
            {myTournaments.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-xl border border-border">
                <p className="text-muted">You haven't joined any tournaments yet.</p>
                <Link href="/" className="text-primary hover:underline mt-2 inline-block">
                  Browse Tournaments
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myTournaments.map((tournament) => (
                  <div key={tournament.id} className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-foreground">{tournament.gameName}</h3>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          tournament.status === 'live'
                            ? 'bg-red-600 text-white'
                            : tournament.status === 'completed'
                            ? 'bg-gray-600 text-white'
                            : 'bg-primary/20 text-primary'
                        }`}
                      >
                        {tournament.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-muted mb-3">
                      Entry: ₹{tournament.entryFee} | Match: {new Date(tournament.matchTime).toLocaleString()}
                    </p>
                    <div className="flex gap-2">
                      <Link
                        href={`/tournaments/${tournament.id}`}
                        className="flex-1 text-center py-2 bg-primary/20 text-primary rounded-lg text-sm font-medium hover:bg-primary hover:text-white transition-colors"
                      >
                        View Details
                      </Link>
                      {tournament.status === 'completed' && (
                        <Link
                          href={`/tournaments/${tournament.id}/submit-result`}
                          className="flex-1 text-center py-2 bg-accent/20 text-accent rounded-lg text-sm font-medium hover:bg-accent hover:text-white transition-colors"
                        >
                          Submit Result
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'results' && (
          <div>
            <h2 className="text-xl font-bold text-foreground mb-4">My Results</h2>
            {myResults.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-xl border border-border">
                <p className="text-muted">No results submitted yet.</p>
              </div>
            ) : (
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <table className="w-full">
                  <thead className="bg-background">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Tournament</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Kills</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Rank</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myResults.map((result) => (
                      <tr key={result.id} className="border-t border-border">
                        <td className="px-4 py-3 text-foreground">{result.tournamentId}</td>
                        <td className="px-4 py-3 text-foreground">{result.kills}</td>
                        <td className="px-4 py-3 text-foreground">#{result.rank}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              result.status === 'approved'
                                ? 'bg-green-600/20 text-green-400'
                                : result.status === 'rejected'
                                ? 'bg-red-600/20 text-red-400'
                                : 'bg-yellow-600/20 text-yellow-400'
                            }`}
                          >
                            {result.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'transactions' && (
          <div>
            <h2 className="text-xl font-bold text-foreground mb-4">Transactions</h2>
            {transactions.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-xl border border-border">
                <p className="text-muted">No transactions yet.</p>
              </div>
            ) : (
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <table className="w-full">
                  <thead className="bg-background">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Description</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="border-t border-border">
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 text-xs rounded-full bg-primary/20 text-primary capitalize">
                            {tx.type}
                          </span>
                        </td>
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
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}