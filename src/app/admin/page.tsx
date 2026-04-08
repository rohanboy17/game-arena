'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { User, Tournament, DepositRequest, WithdrawRequest, Result } from '@/types';
import { getDocuments, updateDocument, COLLECTIONS } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  Users, 
  Trophy, 
  CreditCard, 
  Wallet, 
  TrendingUp,
  CheckCircle,
  XCircle,
  Eye,
  Loader2,
  BarChart3,
  Settings,
  Gamepad2,
  Clock,
  DollarSign,
  UserPlus,
  Plus
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, userData, loading: authLoading, isAdmin } = useAuth();
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeTournaments: 0,
    totalRevenue: 0,
    pendingDeposits: 0,
    pendingWithdrawals: 0,
    pendingResults: 0,
    managers: 0,
  });
  
  const [users, setUsers] = useState<User[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawRequest[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push('/');
    }
  }, [user, authLoading, isAdmin, router]);

  useEffect(() => {
    if (user && isAdmin) {
      loadData();
    }
  }, [user, isAdmin]);

  const loadData = async () => {
    try {
      const [usersData, tournamentsData, depositsData, withdrawalsData, resultsData] = await Promise.all([
        getDocuments<User>(COLLECTIONS.USERS),
        getDocuments<Tournament>(COLLECTIONS.TOURNAMENTS),
        getDocuments<DepositRequest>(COLLECTIONS.DEPOSITS),
        getDocuments<WithdrawRequest>(COLLECTIONS.WITHDRAWALS),
        getDocuments<Result>(COLLECTIONS.RESULTS),
      ]);

      setUsers(usersData);
      setTournaments(tournamentsData);
      setDeposits(depositsData);
      setWithdrawals(withdrawalsData);
      setResults(resultsData);

      const pendingDeposits = depositsData.filter(d => d.status === 'pending');
      const pendingWithdrawals = withdrawalsData.filter(w => w.status === 'pending');
      const pendingResults = resultsData.filter(r => r.status === 'manager_approved' || r.status === 'pending');

      setStats({
        totalUsers: usersData.length,
        activeTournaments: tournamentsData.filter(t => t.status === 'upcoming' || t.status === 'live').length,
        totalRevenue: usersData.reduce((sum, u) => sum + (u.walletBalance || 0), 0),
        pendingDeposits: pendingDeposits.length,
        pendingWithdrawals: pendingWithdrawals.length,
        pendingResults: pendingResults.length,
        managers: usersData.filter(u => u.role === 'manager').length,
      });
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDepositAction = async (id: string, action: 'approve' | 'reject') => {
    setProcessing(id);
    try {
      const deposit = deposits.find(d => d.id === id);
      if (action === 'approve') {
        await updateDocument(COLLECTIONS.DEPOSITS, id, { status: 'approved' });
        
        const { doc, updateDoc, increment } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase');
        const userRef = doc(db, 'users', deposit!.userId);
        await updateDoc(userRef, { walletBalance: increment(deposit!.amount) });
        
        toast.success('Deposit approved! Wallet credited.');
      } else {
        await updateDocument(COLLECTIONS.DEPOSITS, id, { status: 'rejected' });
        toast.success('Deposit rejected.');
      }
      loadData();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Action failed');
    } finally {
      setProcessing(null);
    }
  };

  const handleWithdrawAction = async (id: string, action: 'approve' | 'reject') => {
    setProcessing(id);
    try {
      if (action === 'approve') {
        await updateDocument(COLLECTIONS.WITHDRAWALS, id, { status: 'approved' });
        toast.success('Withdrawal marked as paid!');
      } else {
        const withdrawal = withdrawals.find(w => w.id === id);
        
        const { doc, updateDoc, increment } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase');
        const userRef = doc(db, 'users', withdrawal!.userId);
        await updateDoc(userRef, { walletBalance: increment(withdrawal!.amount) });
        
        await updateDocument(COLLECTIONS.WITHDRAWALS, id, { status: 'rejected' });
        toast.success('Withdrawal rejected. Amount refunded.');
      }
      loadData();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Action failed');
    } finally {
      setProcessing(null);
    }
  };

  const handleResultAction = async (id: string, action: 'approve' | 'reject') => {
    setProcessing(id);
    try {
      const result = results.find(r => r.id === id);
      
      if (action === 'approve') {
        await updateDocument(COLLECTIONS.RESULTS, id, { status: 'approved' });
        
        const tournament = tournaments.find(t => t.id === result!.tournamentId);
        const prize = tournament?.prizeDistribution?.find(p => p.rank === result!.rank);
        
        if (prize?.prize) {
          const { doc, updateDoc, increment } = await import('firebase/firestore');
          const { db } = await import('@/lib/firebase');
          const userRef = doc(db, 'users', result!.userId);
          await updateDoc(userRef, { walletBalance: increment(prize.prize) });
        }
        
        toast.success(`Result approved! Prize: ₹${prize?.prize || 0}`);
      } else {
        await updateDocument(COLLECTIONS.RESULTS, id, { status: 'rejected' });
        toast.success('Result rejected.');
      }
      loadData();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Action failed');
    } finally {
      setProcessing(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  const pendingDeposits = deposits.filter(d => d.status === 'pending');
  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending');
  const finalResults = results.filter(r => r.status === 'manager_approved' || r.status === 'pending');

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-purple-950/5 to-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Settings className="h-7 w-7 text-primary" />
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground">Manage your platform</p>
            </div>
            <div className="flex gap-2">
              <Link href="/admin/tournaments">
                <Button className="bg-gradient-to-r from-primary to-purple-600">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Tournament
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 flex flex-wrap">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="tournaments">Tournaments</TabsTrigger>
            <TabsTrigger value="deposits">
              Deposits
              {pendingDeposits.length > 0 && (
                <Badge className="ml-2 bg-yellow-500">{pendingDeposits.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="withdrawals">
              Withdrawals
              {pendingWithdrawals.length > 0 && (
                <Badge className="ml-2 bg-yellow-500">{pendingWithdrawals.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="results">
              Results
              {finalResults.length > 0 && (
                <Badge className="ml-2 bg-yellow-500">{finalResults.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              {[
                { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-primary' },
                { label: 'Active Tournaments', value: stats.activeTournaments, icon: Trophy, color: 'text-green-500' },
                { label: 'Pending Deposits', value: stats.pendingDeposits, icon: CreditCard, color: 'text-yellow-500' },
                { label: 'Pending Withdrawals', value: stats.pendingWithdrawals, icon: Wallet, color: 'text-orange-500' },
              ].map((stat, i) => (
                <Card key={i} className="border-border/50">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-lg bg-${stat.color.split('-')[1]}/20 flex items-center justify-center`}>
                      <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Recent Deposits
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {pendingDeposits.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No pending deposits</p>
                  ) : (
                    <div className="space-y-2">
                      {pendingDeposits.slice(0, 5).map((d) => (
                        <div key={d.id} className="flex items-center justify-between text-sm">
                          <span>{d.username}</span>
                          <span className="font-bold text-green-400">₹{d.amount}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Platform Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">₹{stats.totalRevenue.toLocaleString()}</div>
                  <p className="text-sm text-muted-foreground">Total wallet balance</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>All Users</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.username}</TableCell>
                        <TableCell className="text-muted-foreground">{u.email}</TableCell>
                        <TableCell>
                          <Badge className={
                            u.role === 'admin' ? 'bg-purple-500' :
                            u.role === 'manager' ? 'bg-blue-500' :
                            'bg-gray-500'
                          }>{u.role}</Badge>
                        </TableCell>
                        <TableCell className="font-bold text-primary">₹{u.walletBalance?.toFixed(0) || 0}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tournaments">
            <Card className="border-border/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Tournaments</CardTitle>
                <Link href="/admin/tournaments">
                  <Button variant="outline" size="sm">Manage</Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {tournaments.slice(0, 6).map((t) => (
                    <div key={t.id} className="rounded-lg border border-border/50 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{t.gameName}</h3>
                        <Badge className={
                          t.status === 'live' ? 'bg-red-500' :
                          t.status === 'completed' ? 'bg-gray-500' :
                          'bg-primary/20 text-primary'
                        }>{t.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Entry: ₹{t.entryFee} • {t.joinedUsers?.length || 0}/{t.totalSlots} slots
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deposits">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Deposit Requests</CardTitle>
              </CardHeader>
              <CardContent>
                {pendingDeposits.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                    <p className="mt-4 text-muted-foreground">No pending deposits</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingDeposits.map((d) => (
                      <div key={d.id} className="flex items-center justify-between rounded-lg bg-background p-4 border border-border/50">
                        <div>
                          <p className="font-medium">{d.username}</p>
                          <p className="text-sm text-muted-foreground">₹{d.amount}</p>
                          {d.screenshotURL && (
                            <a href={d.screenshotURL} target="_blank" rel="noopener noreferrer">
                              <Button variant="link" size="sm" className="h-auto p-0">
                                <Eye className="mr-1 h-3 w-3" />
                                View Screenshot
                              </Button>
                            </a>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            className="bg-green-600"
                            onClick={() => handleDepositAction(d.id, 'approve')}
                            disabled={processing === d.id}
                          >
                            {processing === d.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleDepositAction(d.id, 'reject')}
                            disabled={processing === d.id}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="withdrawals">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Withdrawal Requests</CardTitle>
              </CardHeader>
              <CardContent>
                {pendingWithdrawals.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                    <p className="mt-4 text-muted-foreground">No pending withdrawals</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingWithdrawals.map((w) => (
                      <div key={w.id} className="flex items-center justify-between rounded-lg bg-background p-4 border border-border/50">
                        <div>
                          <p className="font-medium">{w.username}</p>
                          <p className="text-sm text-muted-foreground">₹{w.amount} → {w.upiId}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            className="bg-green-600"
                            onClick={() => handleWithdrawAction(w.id, 'approve')}
                            disabled={processing === w.id}
                          >
                            Mark Paid
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleWithdrawAction(w.id, 'reject')}
                            disabled={processing === w.id}
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Results for Final Approval</CardTitle>
              </CardHeader>
              <CardContent>
                {finalResults.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                    <p className="mt-4 text-muted-foreground">No results pending approval</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {finalResults.map((r) => (
                      <div key={r.id} className="flex items-center justify-between rounded-lg bg-background p-4 border border-border/50">
                        <div>
                          <p className="font-medium">{r.username}</p>
                          <p className="text-sm text-muted-foreground">
                            Rank: #{r.rank} • Kills: {r.kills} • Status: {r.status}
                          </p>
                          {r.screenshotURL && (
                            <a href={r.screenshotURL} target="_blank" rel="noopener noreferrer">
                              <Button variant="link" size="sm" className="h-auto p-0">
                                <Eye className="mr-1 h-3 w-3" />
                                View Screenshot
                              </Button>
                            </a>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            className="bg-green-600"
                            onClick={() => handleResultAction(r.id, 'approve')}
                            disabled={processing === r.id}
                          >
                            Approve & Credit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleResultAction(r.id, 'reject')}
                            disabled={processing === r.id}
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}