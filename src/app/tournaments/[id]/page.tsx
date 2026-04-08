'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useNotification } from '@/lib/notification-context';
import { Tournament } from '@/types';
import { getDocument, COLLECTIONS, updateDocument } from '@/lib/db';
import { db } from '@/lib/firebase';
import { doc, updateDoc, increment, arrayUnion, addDoc, collection } from 'firebase/firestore';
import Countdown from '@/components/Countdown';

export default function TournamentDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { user, userData, loading: authLoading } = useAuth();
  const { addNotification } = useNotification();
  
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [showRoomDetails, setShowRoomDetails] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    loadTournament();
  }, [params.id]);

  const loadTournament = async () => {
    try {
      const data = await getDocument<Tournament>(COLLECTIONS.TOURNAMENTS, params.id as string);
      setTournament(data);
    } catch (error) {
      console.error('Error loading tournament:', error);
      addNotification('Failed to load tournament', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!user || !tournament || !userData) return;

    if (!tournament.joinedUsers) {
      tournament.joinedUsers = [];
    }

    if (tournament.joinedUsers.includes(user.uid)) {
      addNotification('You have already joined this tournament', 'warning');
      return;
    }

    if ((userData.walletBalance || 0) < tournament.entryFee) {
      addNotification('Insufficient wallet balance', 'error');
      router.push('/wallet');
      return;
    }

    if ((tournament.joinedUsers?.length || 0) >= tournament.totalSlots) {
      addNotification('Tournament is full', 'error');
      return;
    }

    setJoining(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        walletBalance: increment(-tournament.entryFee),
      });

      await updateDocument(COLLECTIONS.TOURNAMENTS, tournament.id, {
        joinedUsers: arrayUnion(user.uid),
      });

      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        type: 'entry',
        amount: tournament.entryFee,
        status: 'completed',
        description: `Tournament entry - ${tournament.gameName}`,
        createdAt: new Date().toISOString(),
      });

      addNotification('Successfully joined the tournament!', 'success');
      loadTournament();
    } catch (error) {
      console.error('Join error:', error);
      addNotification('Failed to join tournament', 'error');
    } finally {
      setJoining(false);
    }
  };

  const canShowRoomDetails = () => {
    if (!tournament?.matchTime) return false;
    const matchTime = new Date(tournament.matchTime).getTime();
    const now = Date.now();
    const tenMinutes = 10 * 60 * 1000;
    return matchTime - now <= tenMinutes;
  };

  const isJoined = tournament?.joinedUsers?.includes(user?.uid || '');

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted text-lg">Tournament not found</p>
          <Link href="/" className="text-primary hover:underline mt-2 inline-block">
            Back to Tournaments
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-4xl mx-auto px-4">
        <Link href="/" className="text-primary hover:underline mb-6 inline-block">
          ← Back to Tournaments
        </Link>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="relative h-48 md:h-64 bg-gray-800">
            <div className="absolute inset-0 gaming-gradient opacity-50"></div>
            <div className="absolute top-4 right-4">
              <span
                className={`px-3 py-1 text-sm font-bold rounded-full ${
                  tournament.status === 'live'
                    ? 'bg-red-600 text-white live-badge'
                    : tournament.status === 'completed'
                    ? 'bg-gray-600 text-white'
                    : 'bg-primary/20 text-primary'
                }`}
              >
                {tournament.status.toUpperCase()}
              </span>
            </div>
            <div className="absolute bottom-6 left-6">
              <h1 className="text-3xl md:text-4xl font-bold text-white">{tournament.gameName}</h1>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-background rounded-lg p-4">
                <p className="text-xs text-muted uppercase">Entry Fee</p>
                <p className="text-2xl font-bold text-accent">₹{tournament.entryFee}</p>
              </div>
              <div className="bg-background rounded-lg p-4">
                <p className="text-xs text-muted uppercase">Slots</p>
                <p className="text-2xl font-bold text-foreground">
                  {tournament.joinedUsers?.length || 0}/{tournament.totalSlots}
                </p>
              </div>
              <div className="bg-background rounded-lg p-4">
                <p className="text-xs text-muted uppercase">Prize Pool</p>
                <p className="text-2xl font-bold text-primary">
                  ₹{tournament.prizeDistribution?.reduce((sum, p) => sum + p.prize, 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-background rounded-lg p-4">
                <p className="text-xs text-muted uppercase">Match Time</p>
                <p className="text-lg font-bold text-foreground">
                  {new Date(tournament.matchTime).toLocaleString()}
                </p>
              </div>
            </div>

            {tournament.status === 'upcoming' && (
              <div className="mb-8">
                <p className="text-sm text-muted mb-3">Match Starts In</p>
                <Countdown targetDate={tournament.matchTime} />
              </div>
            )}

            <div className="mb-8">
              <h2 className="text-xl font-bold text-foreground mb-4">Prize Distribution</h2>
              <div className="bg-background rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-card">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Rank</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Prize</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tournament.prizeDistribution?.map((prize, index) => (
                      <tr key={index} className="border-t border-border">
                        <td className="px-4 py-3 text-foreground font-medium">#{prize.rank}</td>
                        <td className="px-4 py-3 text-primary font-bold">₹{prize.prize.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {isJoined && canShowRoomDetails() && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-foreground mb-4">Room Details</h2>
                <div className="bg-background rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted uppercase mb-1">Room ID</p>
                      <p className="text-lg font-bold text-foreground">{tournament.roomId || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted uppercase mb-1">Room Password</p>
                      <p className="text-lg font-bold text-foreground">{tournament.roomPassword || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isJoined && tournament.status === 'completed' && (
              <Link
                href={`/tournaments/${tournament.id}/submit-result`}
                className="block w-full py-3 bg-accent text-white font-bold rounded-lg text-center hover:opacity-90 transition-colors"
              >
                Submit Result
              </Link>
            )}

            {!isJoined && tournament.status === 'upcoming' && (
              <button
                onClick={handleJoin}
                disabled={joining || (tournament.joinedUsers?.length || 0) >= tournament.totalSlots}
                className="w-full py-4 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {joining ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Joining...
                  </span>
                ) : (tournament.joinedUsers?.length || 0) >= tournament.totalSlots ? (
                  'Tournament Full'
                ) : (
                  `Join Tournament - ₹${tournament.entryFee}`
                )}
              </button>
            )}

            {isJoined && tournament.status === 'upcoming' && (
              <div className="mt-4 p-4 bg-green-900/20 border border-green-700 rounded-lg">
                <p className="text-green-400 text-center font-medium">
                  ✓ You have joined this tournament
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}