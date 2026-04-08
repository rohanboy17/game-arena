'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Tournament, Result } from '@/types';
import { getDocument, getDocuments, COLLECTIONS } from '@/lib/db';
import { storage, db } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Trophy, Image as ImageIcon, CheckCircle, Loader2, ArrowLeft, AlertTriangle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export default function SubmitResultPage() {
  const router = useRouter();
  const params = useParams();
  const { user, userData, loading: authLoading } = useAuth();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [existingResult, setExistingResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [kills, setKills] = useState('');
  const [rank, setRank] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && params.id) loadData();
  }, [user, params.id]);

  const loadData = async () => {
    try {
      const t = await getDocument<Tournament>(COLLECTIONS.TOURNAMENTS, params.id as string);
      setTournament(t);
      const q = query(collection(db, 'results'), where('tournamentId', '==', params.id), where('userId', '==', user!.uid));
      const snap = await getDocs(q);
      if (!snap.empty) setExistingResult({ id: snap.docs[0].id, ...snap.docs[0].data() } as Result);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { toast.error('Max 5MB'); return; }
    setScreenshot(f);
    const r = new FileReader(); r.onload = () => setPreview(r.result as string); r.readAsDataURL(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !tournament || !screenshot || !userData) return;
    if (parseInt(kills) < 0 || parseInt(rank) < 1) { toast.error('Invalid data'); return; }
    setSubmitting(true);
    try {
      const sid = uuidv4();
      const sref = ref(storage, `results/${user.uid}/${tournament.id}/${sid}`);
      await uploadBytes(sref, screenshot);
      const url = await getDownloadURL(sref);
      await addDoc(collection(db, 'results'), {
        tournamentId: tournament.id, userId: user.uid, username: userData.username,
        kills: parseInt(kills), rank: parseInt(rank), screenshotURL: url,
        status: 'pending', createdAt: new Date().toISOString(),
      });
      toast.success('Result submitted!');
      router.push('/dashboard');
    } catch (e) { console.error(e); toast.error('Failed'); }
    finally { setSubmitting(false); }
  };

  if (loading || authLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!tournament) return <div className="flex flex-col items-center min-h-[60vh]"><Trophy className="h-16 w-16 text-muted" /><p>Not found</p></div>;
  if (!tournament.joinedUsers?.includes(user?.uid || '')) return <div className="flex flex-col items-center min-h-[60vh]"><AlertTriangle className="h-16 w-16 text-yellow-500" /><p>Not joined</p><Link href={`/tournaments/${tournament.id}`}><Button>View</Button></Link></div>;
  if (existingResult) return <div className="flex flex-col items-center min-h-[60vh] p-8"><CheckCircle className="h-16 w-16 text-green-500" /><h2 className="mt-4 text-xl font-bold">Submitted</h2><p className="text-muted">Rank #{existingResult.rank} • {existingResult.kills} kills</p><Link href="/dashboard"><Button className="mt-6">Dashboard</Button></Link></div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-purple-950/5 to-background">
      <div className="container mx-auto px-4 py-8 max-w-lg">
        <Link href={`/tournaments/${tournament.id}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"><ArrowLeft className="h-4 w-4" />Back</Link>
        <Card>
          <CardHeader><CardTitle>Submit Result</CardTitle><CardDescription>{tournament.gameName}</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-yellow-500/10 p-4"><p className="text-sm text-yellow-500">Submit within 15 min. One submission only.</p></div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Kills</Label><Input type="number" value={kills} onChange={e => setKills(e.target.value)} required min="0" /></div>
                <div className="space-y-2"><Label>Rank</Label><Input type="number" value={rank} onChange={e => setRank(e.target.value)} required min="1" /></div>
              </div>
              <div className="space-y-2">
                <Label>Screenshot</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer" onClick={() => fileRef.current?.click()}>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
                  {preview ? <img src={preview} alt="Preview" className="max-h-40 mx-auto rounded" /> : <ImageIcon className="mx-auto h-10 w-10 text-muted" />}
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={submitting || !screenshot}>{submitting ? 'Submitting...' : 'Submit'}</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}