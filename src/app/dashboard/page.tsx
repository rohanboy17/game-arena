'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Tournament, Result, Transaction } from '@/types';
import { getDocuments, COLLECTIONS } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Wallet, 
  Trophy, 
  Users, 
  TrendingUp, 
  ArrowRight, 
  Gamepad2,
  CreditCard,
  Gift,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, userData, loading: authLoading } = useAuth();
  const [myTournaments, setMyTournaments] = useState<Tournament[]>([]);
  const [myResults, setMyResults] = useState<Result[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

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

      const allResults = await getDocuments<Result>(COLLECTIONS.RESULTS);
      setMyResults(allResults.filter((r) => r.userId === user?.uid));

      const txs = await getDocuments<Transaction>(COLLECTIONS.TRANSACTIONS);
      setTransactions(txs.filter((t) => t.userId === user?.uid).slice(0, 10));
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || !userData) return null;

  const upcomingMatches = myTournaments.filter(t => t.status === 'upcoming');
  const completedTournaments = myTournaments.filter(t => t.status === 'completed');
  const pendingResults = myResults.filter(r => r.status === 'pending');

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-purple-950/5 to-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-purple-600 text-2xl font-bold text-white">
                {userData.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold">{userData.username}</h1>
                <p className="text-muted-foreground">{userData.email}</p>
                <Badge className="mt-1 bg-primary/20 text-primary capitalize">{userData.role}</Badge>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Card className="border-border/50 bg-gradient-to-br from-primary/20 to-purple-600/20">
                <CardContent className="p-4 flex items-center gap-4">
                  <Wallet className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Wallet Balance</p>
                    <p className="text-2xl font-bold text-primary">₹{userData.walletBalance.toFixed(2)}</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-border/50">
                <CardContent className="p-4 flex items-center gap-4">
                  <Gift className="h-8 w-8 text-accent" />
                  <div>
                    <p className="text-sm text-muted-foreground">Referral Code</p>
                    <p className="text-lg font-bold text-accent">{userData.referralCode}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-6">
            <Link href="/wallet?tab=deposit">
              <Button className="bg-gradient-to-r from-primary to-purple-600">
                <CreditCard className="mr-2 h-4 w-4" />
                Add Money
              </Button>
            </Link>
            <Link href="/wallet?tab=withdraw">
              <Button variant="outline">
                <Wallet className="mr-2 h-4 w-4" />
                Withdraw
              </Button>
            </Link>
            <Link href="/tournaments">
              <Button variant="outline">
                <Gamepad2 className="mr-2 h-4 w-4" />
                Join Tournament
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upcoming Matches */}
            <Card className="border-border/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Upcoming Matches
                </CardTitle>
                <Link href="/tournaments">
                  <Button variant="ghost" size="sm">View All</Button>
                </Link>
              </CardHeader>
              <CardContent>
                {upcomingMatches.length === 0 ? (
                  <div className="text-center py-8">
                    <Gamepad2 className="mx-auto h-10 w-10 text-muted-foreground" />
                    <p className="mt-2 text-muted-foreground">No upcoming matches</p>
                    <Link href="/tournaments">
                      <Button className="mt-4">Join a Tournament</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingMatches.slice(0, 3).map((tournament) => (
                      <div 
                        key={tournament.id}
                        className="flex items-center justify-between rounded-lg bg-background p-3 border border-border/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-xl">
                            🎮
                          </div>
                          <div>
                            <p className="font-medium">{tournament.gameName}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(tournament.matchTime).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <Link href={`/tournaments/${tournament.id}`}>
                          <Button size="sm">View</Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Results */}
            <Card className="border-border/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  My Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                {myResults.length === 0 ? (
                  <div className="text-center py-8">
                    <Trophy className="mx-auto h-10 w-10 text-muted-foreground" />
                    <p className="mt-2 text-muted-foreground">No results yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myResults.slice(0, 5).map((result) => (
                      <div 
                        key={result.id}
                        className="flex items-center justify-between rounded-lg bg-background p-3 border border-border/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                            result.status === 'approved' ? 'bg-green-500/20' :
                            result.status === 'rejected' ? 'bg-red-500/20' :
                            'bg-yellow-500/20'
                          }`}>
                            {result.status === 'approved' ? <CheckCircle className="h-5 w-5 text-green-500" /> :
                             result.status === 'rejected' ? <XCircle className="h-5 w-5 text-red-500" /> :
                             <Clock className="h-5 w-5 text-yellow-500" />}
                          </div>
                          <div>
                            <p className="font-medium">Rank #{result.rank} • {result.kills} kills</p>
                            <p className="text-sm text-muted-foreground capitalize">
                              {result.status === 'manager_approved' ? 'Under Review' : result.status}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tournaments Joined</span>
                  <span className="font-bold">{myTournaments.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Completed</span>
                  <span className="font-bold">{completedTournaments.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Results Pending</span>
                  <span className="font-bold text-yellow-500">{pendingResults.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Winnings</span>
                  <span className="font-bold text-primary">₹{userData.walletBalance > 100 ? (userData.walletBalance - 50).toFixed(0) : 0}</span>
                </div>
              </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Recent Transactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No transactions</p>
                ) : (
                  <div className="space-y-2">
                    {transactions.slice(0, 5).map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between text-sm">
                        <span className="capitalize text-muted-foreground">{tx.type}</span>
                        <span className={`font-medium ${
                          tx.type === 'withdrawal' || tx.type === 'entry' ? 'text-red-400' : 'text-green-400'
                        }`}>
                          {tx.type === 'withdrawal' || tx.type === 'entry' ? '-' : '+'}₹{tx.amount}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Referral */}
            <Card className="border-border/50 bg-gradient-to-br from-accent/10 to-yellow-600/10">
              <CardContent className="p-4 text-center">
                <Gift className="mx-auto h-8 w-8 text-accent" />
                <p className="mt-2 font-bold">Invite Friends</p>
                <p className="text-sm text-muted-foreground">Share your code and earn ₹50</p>
                <div className="mt-3 rounded-lg bg-background p-2 font-mono text-lg font-bold text-accent">
                  {userData.referralCode}
                </div>
                <Button size="sm" className="mt-3" onClick={() => navigator.clipboard.writeText(userData.referralCode)}>
                  Copy Code
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}