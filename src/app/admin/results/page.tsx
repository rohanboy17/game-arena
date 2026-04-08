'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useNotification } from '@/lib/notification-context';
import { Result, Tournament, PrizeDistribution } from '@/types';
import { getDocuments, updateDocument, COLLECTIONS } from '@/lib/db';
import { db } from '@/lib/firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';

export default function AdminResultsPage() {
  const router = useRouter();
  const { user, userData, loading: authLoading } = useAuth();
  const { addNotification } = useNotification();
  
  const [results, setResults] = useState<Result[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    if (!authLoading && (!user || !userData?.isAdmin)) {
      router.push('/');
    }
  }, [user, userData, authLoading, router]);

  useEffect(() => {
    if (user && userData?.isAdmin) {
      loadData();
    }
  }, [user, userData]);

  const loadData = async () => {
    try {
      const [resultsData, tournamentsData] = await Promise.all([
        getDocuments<Result>(COLLECTIONS.RESULTS),
        getDocuments<Tournament>(COLLECTIONS.TOURNAMENTS),
      ]);
      setResults(resultsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setTournaments(tournamentsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTournament = (tournamentId: string) => {
    return tournaments.find(t => t.id === tournamentId);
  };

  const calculateWinnings = (result: Result): number => {
    const tournament = getTournament(result.tournamentId);
    if (!tournament) return 0;

    const prize = tournament.prizeDistribution?.find(
      (p: PrizeDistribution) => p.rank === result.rank
    );
    return prize?.prize || 0;
  };

  const handleApprove = async (result: Result) => {
    try {
      await updateDocument(COLLECTIONS.RESULTS, result.id, { status: 'approved' });
      
      const winnings = calculateWinnings(result);
      if (winnings > 0) {
        const userRef = doc(db, 'users', result.userId);
        await updateDoc(userRef, {
          walletBalance: increment(winnings),
        });
      }

      addNotification(`Result approved! Prize: ₹${winnings}`, 'success');
      loadData();
    } catch (error) {
      console.error('Error approving result:', error);
      addNotification('Failed to approve result', 'error');
    }
  };

  const handleReject = async (result: Result) => {
    if (!confirm('Are you sure you want to reject this result?')) return;
    
    try {
      await updateDocument(COLLECTIONS.RESULTS, result.id, { status: 'rejected' });
      addNotification('Result rejected', 'success');
      loadData();
    } catch (error) {
      console.error('Error rejecting result:', error);
      addNotification('Failed to reject result', 'error');
    }
  };

  const filteredResults = results.filter(r => {
    if (filter === 'all') return true;
    return r.status === filter;
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
              <h1 className="text-2xl font-bold text-foreground">Match Results</h1>
              <p className="text-muted">{results.filter(r => r.status === 'pending').length} pending</p>
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

        {filteredResults.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-xl border border-border">
            <p className="text-muted">No results submitted</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredResults.map((result) => {
              const tournament = getTournament(result.tournamentId);
              const winnings = calculateWinnings(result);

              return (
                <div key={result.id} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-foreground">{result.username}</h3>
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
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-muted">Tournament</p>
                          <p className="text-sm text-foreground font-medium">{tournament?.gameName || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted">Kills</p>
                          <p className="text-lg font-bold text-foreground">{result.kills}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted">Rank</p>
                          <p className="text-lg font-bold text-primary">#{result.rank}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted">Prize</p>
                          <p className="text-lg font-bold text-accent">₹{winnings}</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted mt-2">
                        Submitted: {new Date(result.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      {result.screenshotURL && (
                        <a
                          href={result.screenshotURL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-secondary/20 text-secondary rounded-lg font-medium hover:bg-secondary hover:text-white transition-colors text-center"
                        >
                          View Screenshot
                        </a>
                      )}
                      
                      {result.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(result)}
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(result)}
                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}