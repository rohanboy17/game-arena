'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Tournament } from '@/types';
import { getDocuments, COLLECTIONS } from '@/lib/db';

const gameIcons: Record<string, string> = {
  'BGMI': '🎮',
  'Free Fire': '🔥',
  'PUBG': '💀',
  'Valorant': '⚔️',
  'Default': '🏆',
};

const gameColors: Record<string, string> = {
  'BGMI': 'from-green-600 to-emerald-800',
  'Free Fire': 'from-orange-600 to-red-800',
  'PUBG': 'from-blue-600 to-indigo-800',
  'Valorant': 'from-pink-600 to-rose-800',
  'Default': 'from-purple-600 to-indigo-800',
};

let cachedTournaments: Tournament[] | null = null;

export default function HomeContent() {
  const [tournaments, setTournaments] = useState<Tournament[]>(cachedTournaments || []);
  const [loading, setLoading] = useState(!cachedTournaments);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'live'>('all');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadTournaments = useCallback(async () => {
    if (cachedTournaments) {
      setTournaments(cachedTournaments);
      setLoading(false);
      return;
    }

    try {
      const data = await getDocuments<Tournament>(COLLECTIONS.TOURNAMENTS);
      const sorted = data.sort((a, b) => new Date(a.matchTime).getTime() - new Date(b.matchTime).getTime());
      cachedTournaments = sorted;
      setTournaments(sorted);
    } catch (error) {
      console.error('Error loading tournaments:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTournaments();
  }, [loadTournaments]);

  const filteredTournaments = tournaments.filter((t) => {
    if (filter === 'all') return true;
    return t.status === filter;
  });

  const getGameIcon = (gameName: string) => gameIcons[gameName] || gameIcons['Default'];
  const getGameGradient = (gameName: string) => gameColors[gameName] || gameColors['Default'];

  const getStatusBadge = (status: string) => {
    if (status === 'live') {
      return <span className="px-3 py-1 text-xs font-bold rounded-full bg-red-600 text-white animate-pulse">LIVE</span>;
    }
    if (status === 'completed') {
      return <span className="px-3 py-1 text-xs font-bold rounded-full bg-gray-600 text-white">COMPLETED</span>;
    }
    return <span className="px-3 py-1 text-xs font-bold rounded-full bg-primary/20 text-primary">UPCOMING</span>;
  };

  const formatTimeLeft = (matchTime: string) => {
    const diff = new Date(matchTime).getTime() - Date.now();
    if (diff <= 0) return 'Starting soon';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    return `${hours}h ${minutes}m`;
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background">
        <div className="gaming-gradient py-16 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Compete & Win</h1>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted">Loading tournaments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="gaming-gradient py-12 md:py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-3">Compete & Win Real Rewards</h1>
          <p className="text-lg md:text-xl text-white/80 mb-6">Join skill-based eSports tournaments</p>
          <Link href="/signup" className="inline-block px-6 py-2.5 bg-white text-primary font-bold rounded-lg hover:bg-gray-100 transition-colors">
            Get Started
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-foreground">Tournaments</h2>
          <div className="flex gap-2">
            {(['all', 'upcoming', 'live'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filter === f ? 'bg-primary text-white' : 'bg-card text-muted hover:text-foreground'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {filteredTournaments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted">No tournaments available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredTournaments.map((tournament) => (
              <div
                key={tournament.id}
                className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-all"
              >
                <div className={`h-32 bg-gradient-to-br ${getGameGradient(tournament.gameName)} flex items-center justify-center`}>
                  <span className="text-5xl">{getGameIcon(tournament.gameName)}</span>
                </div>

                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-foreground">{tournament.gameName}</h3>
                    {getStatusBadge(tournament.status)}
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                    <div>
                      <p className="text-muted text-xs">Entry Fee</p>
                      <p className="text-lg font-bold text-accent">₹{tournament.entryFee}</p>
                    </div>
                    <div>
                      <p className="text-muted text-xs">Slots</p>
                      <p className="text-lg font-bold">{tournament.joinedUsers?.length || 0}/{tournament.totalSlots}</p>
                    </div>
                  </div>

                  {tournament.status === 'upcoming' && (
                    <div className="mb-3 text-sm">
                      <p className="text-muted text-xs mb-1">Starts in</p>
                      <p className="text-primary font-medium">{formatTimeLeft(tournament.matchTime)}</p>
                    </div>
                  )}

                  <div className="mb-3 text-sm">
                    <p className="text-muted text-xs mb-1">Prize Pool</p>
                    <p className="text-primary font-bold">₹{(tournament.prizeDistribution || []).reduce((sum, p) => sum + p.prize, 0).toLocaleString()}</p>
                  </div>

                  <Link
                    href={`/tournaments/${tournament.id}`}
                    className="block w-full py-2.5 text-center bg-primary/20 text-primary font-medium rounded-lg hover:bg-primary hover:text-white transition-colors text-sm"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}