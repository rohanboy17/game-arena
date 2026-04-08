'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Tournament, Result } from '@/types';
import { getDocument, getDocuments, updateDocument, COLLECTIONS } from '@/lib/db';
import { db } from '@/lib/firebase';
import { doc, updateDoc, increment, arrayUnion, addDoc, collection } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Trophy, Clock, Copy, Check, Lock, Unlock, Loader2, ArrowLeft } from 'lucide-react';

export default function TournamentDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { user, userData, loading: authLoading } = useAuth();
  
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [existingResult, setExistingResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [copied, setCopied] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && params.id) loadData();
  }, [user, params.id]);

  const loadData = async () => {
    try {
      const data = await getDocument<Tournament>(COLLECTIONS.TOURNAMENTS, params.id as string);
      setTournament(data);
      if (user) {
        const results = await getDocuments<Result>(COLLECTIONS.RESULTS);
        const userResult = results.find(r => r.tournamentId === params.id && r.userId === user.uid);
        setExistingResult(userResult || null);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!user || !tournament || !userData) return;
    if (tournament.joinedUsers?.includes(user.uid)) { toast.warning('Already joined'); return; }
    if ((userData.walletBalance || 0) < tournament.entryFee) { toast.error('Insufficient balance'); router.push('/wallet'); return; }
    if ((tournament.joinedUsers?.length || 0) >= tournament.totalSlots) { toast.error('Tournament full'); return; }

    setJoining(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { walletBalance: increment(-tournament.entryFee) });
      await updateDocument(COLLECTIONS.TOURNAMENTS, tournament.id, { joinedUsers: arrayUnion(user.uid) });
      await addDoc(collection(db, 'transactions'), {
        userId: user.uid, type: 'entry', amount: tournament.entryFee, status: 'completed',
        description: `Tournament entry - ${tournament.gameName}`, createdAt: new Date().toISOString(),
      });
      toast.success('Joined successfully!');
      loadData();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to join');
    } finally {
      setJoining(false);
    }
  };

  const canShowRoom = () => {
    if (!tournament?.matchTime) return false;
    return new Date(tournament.matchTime).getTime() - Date.now() <= 10 * 60 * 1000;
  };

  const isJoined = tournament?.joinedUsers?.includes(user?.uid || '');

  const formatTimeLeft = (matchTime: string) => {
    const diff = new Date(matchTime).getTime() - Date.now();
    if (diff <= 0) return 'Starting soon';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
    return `${hours}h ${minutes}m`;
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(''), 2000);
  };

  if (loading || authLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!tournament) return <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4"><Trophy className="h-16 w-16 text-muted-foreground" /><p className="text-muted-foreground">Tournament not found</p><Link href="/tournaments"><Button>Browse Tournaments</Button></Link></div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-purple-950/5 to-background">
      <div className="container mx-auto px-4 py-8">
        <Link href="/tournaments" className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"><ArrowLeft className="h-4 w-4" /> Back</Link>

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-purple-600/20 to-primary/10 p-8 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <Badge className="mb-3 bg-primary/20 text-primary">{tournament.status}</Badge>
              <h1 className="text-3xl font-bold">{tournament.gameName}</h1>
              <p className="text-muted-foreground mt-1">{new Date(tournament.matchTime).toLocaleString()}</p>
            </div>
            <div className="flex gap-4">
              <div className="text-center p-4 rounded-xl bg-card/50"><p className="text-sm text-muted-foreground">Entry</p><p className="text-2xl font-bold text-accent">₹{tournament.entryFee}</p></div>
              <div className="text-center p-4 rounded-xl bg-card/50"><p className="text-sm text-muted-foreground">Slots</p><p className="text-2xl font-bold">{tournament.joinedUsers?.length || 0}/{tournament.totalSlots}</p></div>
              <div className="text-center p-4 rounded-xl bg-card/50"><p className="text-sm text-muted-foreground">Prize</p><p className="text-2xl font-bold text-primary">₹{tournament.prizeDistribution?.reduce((s, p) => s + p.prize, 0).toLocaleString()}</p></div>
            </div>
          </div>
          {tournament.status === 'upcoming' && <div className="mt-6 flex items-center gap-2"><Clock className="h-5 w-5 text-primary" /><span className="text-primary font-medium">Starts in {formatTimeLeft(tournament.matchTime)}</span></div>}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-border/50">
              <CardHeader><CardTitle>Prize Distribution</CardTitle></CardHeader>
              <CardContent>
                <div className="grid gap-2 sm:grid-cols-2">
                  {tournament.prizeDistribution?.map((p, i) => (
                    <div key={i} className="flex justify-between rounded-lg bg-background p-3 border"><span className="font-medium">Rank #{p.rank}</span><span className="font-bold text-primary">₹{p.prize}</span></div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {(isJoined || userData?.role === 'admin' || userData?.role === 'manager') && (
              <Card className="border-border/50">
                <CardHeader><CardTitle className="flex items-center gap-2">{canShowRoom() || userData?.role === 'admin' ? <Unlock className="h-5 w-5 text-green-500" /> : <Lock className="h-5 w-5" />} Room Details</CardTitle></CardHeader>
                <CardContent>
                  {!canShowRoom() && userData?.role !== 'admin' ? <div className="text-center py-6"><Lock className="mx-auto h-10 w-10 text-muted-foreground" /><p className="mt-2 text-muted-foreground">Visible 10 min before match</p></div> : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="flex justify-between items-center rounded-lg bg-background p-4 border"><div><p className="text-sm text-muted-foreground">Room ID</p><p className="font-mono">{tournament.roomId || 'N/A'}</p></div>{tournament.roomId && <Button size="sm" variant="outline" onClick={() => copyToClipboard(tournament.roomId!, 'id')}>{copied === 'id' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}</Button>}</div>
                      <div className="flex justify-between items-center rounded-lg bg-background p-4 border"><div><p className="text-sm text-muted-foreground">Password</p><p className="font-mono">{tournament.roomPassword || 'N/A'}</p></div>{tournament.roomPassword && <Button size="sm" variant="outline" onClick={() => copyToClipboard(tournament.roomPassword!, 'pw')}>{copied === 'pw' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}</Button>}</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            {tournament.status === 'upcoming' && !isJoined && <Button size="lg" className="w-full h-14 bg-gradient-to-r from-primary to-purple-600" onClick={handleJoin} disabled={joining}>{joining ? 'Joining...' : `Join - ₹${tournament.entryFee}`}</Button>}
            {isJoined && <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-4 text-center"><Check className="mx-auto h-8 w-8 text-green-500" /><p className="mt-2 font-bold text-green-500">You joined</p></div>}
            {isJoined && tournament.status === 'completed' && !existingResult && <Link href={`/tournaments/${tournament.id}/submit-result`}><Button size="lg" className="w-full bg-gradient-to-r from-accent to-yellow-600">Submit Result</Button></Link>}
            {existingResult && <div className="rounded-xl bg-yellow-500/10 p-4"><p className="font-bold">Submitted</p><p className="text-sm">Rank #{existingResult.rank} • {existingResult.kills} kills</p></div>}
          </div>
        </div>
      </div>
    </div>
  );
}