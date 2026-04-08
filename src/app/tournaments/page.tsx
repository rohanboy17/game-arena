'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Tournament } from '@/types';
import { getDocuments, COLLECTIONS } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Clock, Users, Gamepad2, ArrowRight, Search, Filter } from 'lucide-react';

const gameIcons: Record<string, string> = {
  'BGMI': '🎮',
  'Free Fire': '🔥',
  'PUBG': '💀',
  'Valorant': '⚔️',
  'Default': '🎯',
};

const gameGradients: Record<string, string> = {
  'BGMI': 'from-green-500 to-emerald-700',
  'Free Fire': 'from-orange-500 to-red-700',
  'PUBG': 'from-blue-500 to-indigo-700',
  'Valorant': 'from-pink-500 to-rose-700',
  'Default': 'from-purple-500 to-indigo-700',
};

export default function TournamentsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'live'>('all');

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const data = await getDocuments<Tournament>(COLLECTIONS.TOURNAMENTS);
      setTournaments(data.sort((a, b) => 
        new Date(a.matchTime).getTime() - new Date(b.matchTime).getTime()
      ));
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
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

  const getStatusBadge = (status: string) => {
    if (status === 'live') {
      return <Badge className="bg-red-500 animate-pulse">LIVE</Badge>;
    }
    if (status === 'completed') {
      return <Badge className="bg-gray-500">COMPLETED</Badge>;
    }
    return <Badge className="bg-primary/20 text-primary">UPCOMING</Badge>;
  };

  const filteredTournaments = tournaments.filter(t => {
    if (filter === 'all') return t.status !== 'completed';
    return t.status === filter;
  });

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading tournaments...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-purple-950/5 to-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Gamepad2 className="h-7 w-7 text-primary" />
                Tournaments
              </h1>
              <p className="text-muted-foreground">Browse and join competitive matches</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            className={filter === 'all' ? 'bg-gradient-to-r from-primary to-purple-600' : ''}
            onClick={() => setFilter('all')}
          >
            <Filter className="mr-2 h-4 w-4" />
            All
          </Button>
          <Button
            variant={filter === 'upcoming' ? 'default' : 'outline'}
            className={filter === 'upcoming' ? 'bg-gradient-to-r from-primary to-purple-600' : ''}
            onClick={() => setFilter('upcoming')}
          >
            <Clock className="mr-2 h-4 w-4" />
            Upcoming
          </Button>
          <Button
            variant={filter === 'live' ? 'default' : 'outline'}
            className={filter === 'live' ? 'bg-gradient-to-r from-primary to-purple-600' : ''}
            onClick={() => setFilter('live')}
          >
            <Trophy className="mr-2 h-4 w-4" />
            Live
          </Button>
        </div>

        {/* Tournaments Grid */}
        {filteredTournaments.length === 0 ? (
          <div className="rounded-xl border border-dashed p-12 text-center">
            <Gamepad2 className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No tournaments found</h3>
            <p className="text-muted-foreground">Check back soon for new matches</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTournaments.map((tournament) => (
              <Card key={tournament.id} className="overflow-hidden border-border/50 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10">
                <div className={`h-32 bg-gradient-to-br ${gameGradients[tournament.gameName] || gameGradients['Default']} flex items-center justify-center`}>
                  <span className="text-6xl">{gameIcons[tournament.gameName] || gameIcons['Default']}</span>
                </div>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{tournament.gameName}</CardTitle>
                    {getStatusBadge(tournament.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Entry Fee</p>
                      <p className="text-xl font-bold text-accent">₹{tournament.entryFee}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Slots</p>
                      <p className="text-xl font-bold">{tournament.joinedUsers?.length || 0}/{tournament.totalSlots}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <div>
                      <p className="text-muted-foreground">Prize Pool</p>
                      <p className="font-semibold text-primary">
                        ₹{tournament.prizeDistribution?.reduce((sum, p) => sum + p.prize, 0).toLocaleString()}
                      </p>
                    </div>
                    {tournament.status === 'upcoming' && (
                      <div className="text-right">
                        <p className="text-muted-foreground">Starts in</p>
                        <p className="font-medium text-primary">{formatTimeLeft(tournament.matchTime)}</p>
                      </div>
                    )}
                  </div>
                  <Link href={`/tournaments/${tournament.id}`}>
                    <Button className="mt-4 w-full bg-gradient-to-r from-primary to-purple-600 hover:opacity-90">
                      View Details
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}