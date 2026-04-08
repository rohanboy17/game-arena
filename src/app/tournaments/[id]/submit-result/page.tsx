'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useNotification } from '@/lib/notification-context';
import { Tournament, Result } from '@/types';
import { getDocument, getDocuments, COLLECTIONS } from '@/lib/db';
import { storage, db } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

export default function SubmitResultPage() {
  const router = useRouter();
  const params = useParams();
  const { user, userData, loading: authLoading } = useAuth();
  const { addNotification } = useNotification();
  
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [existingResult, setExistingResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [kills, setKills] = useState('');
  const [rank, setRank] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && params.id) {
      loadData();
    }
  }, [user, params.id]);

  const loadData = async () => {
    try {
      const tournamentData = await getDocument<Tournament>(COLLECTIONS.TOURNAMENTS, params.id as string);
      setTournament(tournamentData);

      const resultsQuery = query(
        collection(db, 'results'),
        where('tournamentId', '==', params.id),
        where('userId', '==', user!.uid)
      );
      const resultsSnapshot = await getDocs(resultsQuery);
      
      if (!resultsSnapshot.empty) {
        const resultData = resultsSnapshot.docs[0].data();
        setExistingResult({ id: resultsSnapshot.docs[0].id, ...resultData } as Result);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        addNotification('File size must be less than 5MB', 'error');
        return;
      }
      setScreenshot(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !tournament || !screenshot || !userData) return;

    const killCount = parseInt(kills);
    const rankNum = parseInt(rank);

    if (isNaN(killCount) || isNaN(rankNum) || killCount < 0 || rankNum < 1) {
      addNotification('Please enter valid kills and rank', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const screenshotId = uuidv4();
      const screenshotRef = ref(storage, `results/${user.uid}/${tournament.id}/${screenshotId}`);
      await uploadBytes(screenshotRef, screenshot);
      const screenshotURL = await getDownloadURL(screenshotRef);

      await addDoc(collection(db, 'results'), {
        tournamentId: tournament.id,
        userId: user.uid,
        username: userData.username,
        kills: killCount,
        rank: rankNum,
        screenshotURL,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });

      addNotification('Result submitted successfully!', 'success');
      router.push('/dashboard');
    } catch (error) {
      console.error('Submit error:', error);
      addNotification('Failed to submit result', 'error');
    } finally {
      setSubmitting(false);
    }
  };

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

  if (!tournament.joinedUsers?.includes(user?.uid || '')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted text-lg">You haven't joined this tournament</p>
          <Link href={`/tournaments/${tournament.id}`} className="text-primary hover:underline mt-2 inline-block">
            View Tournament
          </Link>
        </div>
      </div>
    );
  }

  if (existingResult) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="max-w-2xl mx-auto px-4">
          <Link href={`/tournaments/${tournament.id}`} className="text-primary hover:underline mb-6 inline-block">
            ← Back to Tournament
          </Link>

          <div className="bg-card border border-border rounded-xl p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-yellow-600/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-yellow-400">!</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Result Already Submitted</h1>
            <p className="text-muted mb-4">
              You have already submitted your result for this tournament.
            </p>
            <div className="bg-background rounded-lg p-4 mb-6">
              <p className="text-sm text-muted">Kills: <span className="text-foreground font-bold">{existingResult.kills}</span></p>
              <p className="text-sm text-muted">Rank: <span className="text-foreground font-bold">#{existingResult.rank}</span></p>
              <p className="text-sm text-muted">Status: <span className="text-yellow-400 font-bold">{existingResult.status.toUpperCase()}</span></p>
            </div>
            <Link
              href="/dashboard"
              className="inline-block px-6 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-2xl mx-auto px-4">
        <Link href={`/tournaments/${tournament.id}`} className="text-primary hover:underline mb-6 inline-block">
          ← Back to Tournament
        </Link>

        <div className="bg-card border border-border rounded-xl p-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">Submit Result</h1>
          <p className="text-muted mb-6">{tournament.gameName} - {new Date(tournament.matchTime).toLocaleString()}</p>

          <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-400">
              <span className="font-bold">Important:</span> Submit your result within 15 minutes after the match ends. 
              Only one submission is allowed per match.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Total Kills
              </label>
              <input
                type="number"
                value={kills}
                onChange={(e) => setKills(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                placeholder="Enter total kills"
                required
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Final Rank
              </label>
              <input
                type="number"
                value={rank}
                onChange={(e) => setRank(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                placeholder="Enter final rank"
                required
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Match Screenshot
              </label>
              <p className="text-xs text-muted mb-2">
                Upload a screenshot showing your kills and rank from the match
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleScreenshotChange}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-white file:cursor-pointer"
                required
              />
              {screenshotPreview && (
                <div className="mt-4">
                  <img
                    src={screenshotPreview}
                    alt="Screenshot preview"
                    className="max-h-48 rounded-lg border border-border"
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting || !screenshot}
              className="w-full py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Submitting...
                </span>
              ) : (
                'Submit Result'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}