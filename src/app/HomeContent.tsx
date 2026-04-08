'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tournament, User } from '@/types';
import { getDocuments, COLLECTIONS } from '@/lib/db';
import { 
  Trophy, 
  Medal, 
  Users, 
  Gamepad2, 
  ArrowRight, 
  Zap,
  Crown,
  Target,
  Wallet
} from 'lucide-react';

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

const howItWorks = [
  {
    icon: Gamepad2,
    title: 'Join a Tournament',
    desc: 'Browse available tournaments and join with your entry fee'
  },
  {
    icon: Target,
    title: 'Play & Submit',
    desc: 'Compete in the match and submit your result with screenshot'
  },
  {
    icon: Trophy,
    title: 'Win Rewards',
    desc: 'Get verified and win real cash directly to your wallet'
  }
];

export default function HomeContent() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await getDocuments<Tournament>(COLLECTIONS.TOURNAMENTS);
      setTournaments(data.filter(t => t.status !== 'completed').sort((a, b) => 
        new Date(a.matchTime).getTime() - new Date(b.matchTime).getTime()
      ).slice(0, 6));
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
    return <Badge className="bg-primary/20 text-primary">UPCOMING</Badge>;
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-background via-purple-950/20 to-background">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-500/20 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NCAwLTE4IDguMDYtMTggMThzOC4wNiAxOCAxOCAxOCAxOC04LjA2IDE4LTE4LTguMDYtMTgtMTgtMTh6bTAgMzBjLTcuNzIgMC00LTEyLjI4LTQtMTJzNi4yOC0yMCAxNC0yMCAxNCA2LjI4IDE0IDEyLTYuMjggMjAtMTQgMjAtMTQtNi4yOC0yMC0xNC0yMHoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjAyIi8+PC9nPjwvc3ZnPg==')] opacity-30" />
        
        <div className="container relative mx-auto px-4 py-20 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary">
              <Zap className="h-4 w-4" />
              <span>Win Real Cash Daily</span>
            </div>
            
            <h1 className="mb-6 text-4xl font-bold leading-tight md:text-6xl lg:text-7xl">
              <span className="bg-gradient-to-r from-white via-white to-purple-300 bg-clip-text text-transparent">
                Play. Compete.
              </span>
              <br />
              <span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                Win Real Cash.
              </span>
            </h1>
            
            <p className="mb-8 text-lg text-muted-foreground md:text-xl">
              Join skill-based eSports tournaments. Prove your gaming prowess. 
              Earn real rewards. No gambling - just pure skill.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 text-lg h-12 px-8"
                >
                  Join Tournament
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/tournaments">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="w-full sm:w-auto text-lg h-12 px-8"
                >
                  Browse Tournaments
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { label: 'Active Tournaments', value: tournaments.length },
              { label: 'Total Players', value: '10K+' },
              { label: 'Prize Distributed', value: '₹50L+' },
              { label: 'Success Rate', value: '99%' }
            ].map((stat, i) => (
              <div key={i} className="rounded-xl border bg-card/50 p-4 text-center backdrop-blur-sm">
                <div className="text-2xl font-bold text-primary md:text-3xl">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Tournaments */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mb-10 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold md:text-3xl">Featured Tournaments</h2>
              <p className="text-muted-foreground">Join the hottest matches happening now</p>
            </div>
            <Link href="/tournaments">
              <Button variant="outline">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-80 animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          ) : tournaments.length === 0 ? (
            <div className="rounded-xl border border-dashed p-12 text-center">
              <Trophy className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No tournaments yet</h3>
              <p className="text-muted-foreground">Check back soon for new matches</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {tournaments.map((tournament) => (
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
                        Join Now
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-24 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold md:text-3xl">How It Works</h2>
            <p className="text-muted-foreground">Start competing in 3 simple steps</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {howItWorks.map((step, i) => (
              <div key={i} className="group relative rounded-xl border bg-card p-6 text-center transition-all hover:-translate-y-1 hover:border-primary/50">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-primary to-purple-600 p-3">
                  <step.icon className="h-6 w-6 text-white" />
                </div>
                <div className="mt-6">
                  <h3 className="mb-2 text-lg font-bold">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </div>
                {i < 2 && (
                  <ArrowRight className="absolute -right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground md:hidden" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Winners */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mb-10">
            <h2 className="text-2xl font-bold md:text-3xl flex items-center gap-2">
              <Crown className="h-8 w-8 text-yellow-500" />
              Top Winners
            </h2>
            <p className="text-muted-foreground">This week&apos;s champions</p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              { rank: 1, name: 'ProGamer_01', amount: '₹12,500', icon: '👑' },
              { rank: 2, name: 'ShadowStrike', amount: '₹8,200', icon: '⚔️' },
              { rank: 3, name: 'BattleKing', amount: '₹5,000', icon: '🎮' },
            ].map((winner, i) => (
              <Card key={i} className={`${i === 0 ? 'border-yellow-500/50 bg-yellow-500/5' : ''} transition-all hover:scale-[1.02]`}>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
                    winner.rank === 1 ? 'bg-yellow-500' : winner.rank === 2 ? 'bg-gray-400' : 'bg-orange-700'
                  } text-2xl`}>
                    {winner.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold">{winner.name}</p>
                    <p className="text-sm text-muted-foreground">Rank #{winner.rank}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{winner.amount}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-primary/20 via-purple-500/20 to-primary/20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold md:text-3xl">Ready to Compete?</h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Join thousands of gamers already winning real cash. Sign up now and get bonus on your first deposit!
          </p>
<Link href="/signup">
            <Button 
              size="lg" 
              className="mt-8 bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 text-lg h-12 px-8"
            >
              Create Free Account
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}