'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Tournament, Result } from '@/types';
import { getDocuments, updateDocument, COLLECTIONS } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Trophy, 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock,
  Eye,
  Loader2,
  Gamepad2,
  Search
} from 'lucide-react';

export default function ManagerDashboardPage() {
  const router = useRouter();
  const { user, userData, loading: authLoading, isManager } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [pendingResults, setPendingResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || !isManager)) {
      router.push('/');
    }
  }, [user, authLoading, isManager, router]);

  useEffect(() => {
    if (user && isManager) {
      loadData();
    }
  }, [user, isManager]);

  const loadData = async () => {
    try {
      const allTournaments = await getDocuments<Tournament>(COLLECTIONS.TOURNAMENTS);
      const myTournaments = allTournaments.filter((t) => t.assignedManagerId === user?.uid);
      setTournaments(myTournaments);

      const allResults = await getDocuments<Result>(COLLECTIONS.RESULTS);
      const myTournamentIds = myTournaments.map(t => t.id);
      const pending = allResults.filter((r) => 
        myTournamentIds.includes(r.tournamentId) && r.status === 'pending'
      );
      setPendingResults(pending);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (resultId: string) => {
    setProcessing(resultId);
    try {
      await updateDocument(COLLECTIONS.RESULTS, resultId, {
        status: 'manager_approved',
        reviewedBy: user?.uid,
        reviewedAt: new Date().toISOString(),
      });
      toast.success('Result approved! Waiting for admin final verification.');
      loadData();
    } catch (error) {
      console.error('Error approving result:', error);
      toast.error('Failed to approve result');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (resultId: string) => {
    if (!confirm('Are you sure you want to reject this result?')) return;
    
    setProcessing(resultId);
    try {
      await updateDocument(COLLECTIONS.RESULTS, resultId, {
        status: 'rejected',
        reviewedBy: user?.uid,
        reviewedAt: new Date().toISOString(),
      });
      toast.success('Result rejected');
      loadData();
    } catch (error) {
      console.error('Error rejecting result:', error);
      toast.error('Failed to reject result');
    } finally {
      setProcessing(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !isManager) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-purple-950/5 to-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Users className="h-7 w-7 text-primary" />
                Manager Dashboard
              </h1>
              <p className="text-muted-foreground">Verify match results for your tournaments</p>
            </div>
            <Badge className="bg-primary/20 text-primary">Manager</Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3 mb-8">
          <Card className="border-border/50">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center">
                <Trophy className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">My Tournaments</p>
                <p className="text-2xl font-bold">{tournaments.length}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border/50">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Results</p>
                <p className="text-2xl font-bold text-yellow-500">{pendingResults.length}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border/50">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Reviewed Today</p>
                <p className="text-2xl font-bold">0</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Results */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              Pending Result Reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingResults.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                <h3 className="mt-4 text-lg font-semibold">All caught up!</h3>
                <p className="text-muted-foreground">No pending results to review</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingResults.map((result) => (
                  <div 
                    key={result.id}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-lg bg-background p-4 border border-border/50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold">
                          {result.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{result.username}</p>
                          <p className="text-sm text-muted-foreground">
                            Tournament: {result.tournamentId.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm">
                        <span className="px-2 py-1 rounded bg-primary/10 text-primary">
                          Rank: #{result.rank}
                        </span>
                        <span className="px-2 py-1 rounded bg-accent/10 text-accent">
                          Kills: {result.kills}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {result.screenshotURL && (
                        <a href={result.screenshotURL} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm">
                            <Eye className="mr-1 h-4 w-4" />
                            View Screenshot
                          </Button>
                        </a>
                      )}
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleApprove(result.id)}
                        disabled={processing === result.id}
                      >
                        {processing === result.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle className="mr-1 h-4 w-4" />
                            Approve
                          </>
                        )}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleReject(result.id)}
                        disabled={processing === result.id}
                      >
                        <XCircle className="mr-1 h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* My Tournaments */}
        <Card className="border-border/50 mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gamepad2 className="h-5 w-5 text-primary" />
              My Tournaments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tournaments.length === 0 ? (
              <div className="text-center py-8">
                <Trophy className="mx-auto h-10 w-10 text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">No tournaments assigned to you yet</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {tournaments.map((tournament) => (
                  <div 
                    key={tournament.id}
                    className="rounded-lg border border-border/50 p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{tournament.gameName}</h3>
                      <Badge className={
                        tournament.status === 'live' ? 'bg-red-500' :
                        tournament.status === 'completed' ? 'bg-gray-500' :
                        'bg-primary/20 text-primary'
                      }>
                        {tournament.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Entry: ₹{tournament.entryFee} • Slots: {tournament.joinedUsers?.length || 0}/{tournament.totalSlots}</p>
                      <p>{new Date(tournament.matchTime).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}