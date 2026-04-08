'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useNotification } from '@/lib/notification-context';
import { Tournament, PrizeDistribution } from '@/types';
import { getDocuments, addDocument, updateDocument, deleteDocument, COLLECTIONS } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export default function AdminTournamentsPage() {
  const router = useRouter();
  const { user, userData, loading: authLoading } = useAuth();
  const { addNotification } = useNotification();
  
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    gameName: '',
    entryFee: '',
    totalSlots: '',
    matchTime: '',
    roomId: '',
    roomPassword: '',
    prizeDistribution: '1,1000|2,500|3,250|4,100|5,50',
  });

  useEffect(() => {
    if (!authLoading && (!user || !userData?.isAdmin)) {
      router.push('/');
    }
  }, [user, userData, authLoading, router]);

  useEffect(() => {
    if (user && userData?.isAdmin) {
      loadTournaments();
    }
  }, [user, userData]);

  const loadTournaments = async () => {
    try {
      const data = await getDocuments<Tournament>(COLLECTIONS.TOURNAMENTS);
      setTournaments(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error('Error loading tournaments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const prizes: PrizeDistribution[] = formData.prizeDistribution.split('|').map((p) => {
        const [rank, prize] = p.split(',');
        return { rank: parseInt(rank), prize: parseInt(prize) };
      });

      const tournamentData = {
        gameName: formData.gameName,
        entryFee: parseInt(formData.entryFee),
        totalSlots: parseInt(formData.totalSlots),
        matchTime: new Date(formData.matchTime).toISOString(),
        roomId: formData.roomId || '',
        roomPassword: formData.roomPassword || '',
        prizeDistribution: prizes,
        joinedUsers: editingTournament?.joinedUsers || [],
        status: 'upcoming' as const,
        createdAt: editingTournament?.createdAt || new Date().toISOString(),
      };

      if (editingTournament) {
        await updateDocument(COLLECTIONS.TOURNAMENTS, editingTournament.id, tournamentData);
        addNotification('Tournament updated successfully', 'success');
      } else {
        await addDocument(COLLECTIONS.TOURNAMENTS, tournamentData);
        addNotification('Tournament created successfully', 'success');
      }

      setShowModal(false);
      setEditingTournament(null);
      resetForm();
      loadTournaments();
    } catch (error) {
      console.error('Error saving tournament:', error);
      addNotification('Failed to save tournament', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tournament?')) return;
    
    try {
      await deleteDocument(COLLECTIONS.TOURNAMENTS, id);
      addNotification('Tournament deleted', 'success');
      loadTournaments();
    } catch (error) {
      console.error('Error deleting tournament:', error);
      addNotification('Failed to delete tournament', 'error');
    }
  };

  const handleStatusChange = async (id: string, status: 'upcoming' | 'live' | 'completed') => {
    try {
      await updateDocument(COLLECTIONS.TOURNAMENTS, id, { status });
      addNotification(`Tournament marked as ${status}`, 'success');
      loadTournaments();
    } catch (error) {
      console.error('Error updating status:', error);
      addNotification('Failed to update status', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      gameName: '',
      entryFee: '',
      totalSlots: '',
      matchTime: '',
      roomId: '',
      roomPassword: '',
      prizeDistribution: '1,1000|2,500|3,250|4,100|5,50',
    });
  };

  const openEditModal = (tournament: Tournament) => {
    setEditingTournament(tournament);
    setFormData({
      gameName: tournament.gameName,
      entryFee: tournament.entryFee.toString(),
      totalSlots: tournament.totalSlots.toString(),
      matchTime: tournament.matchTime.slice(0, 16),
      roomId: tournament.roomId || '',
      roomPassword: tournament.roomPassword || '',
      prizeDistribution: tournament.prizeDistribution.map(p => `${p.rank},${p.prize}`).join('|'),
    });
    setShowModal(true);
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user || !userData?.isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-primary hover:underline">← Back</Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Manage Tournaments</h1>
                <p className="text-muted">{tournaments.length} tournaments</p>
              </div>
            </div>
            <button
              onClick={() => { resetForm(); setEditingTournament(null); setShowModal(true); }}
              className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
            >
              Create Tournament
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tournaments.map((tournament) => (
            <div key={tournament.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-foreground">{tournament.gameName}</h3>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    tournament.status === 'live'
                      ? 'bg-red-600 text-white'
                      : tournament.status === 'completed'
                      ? 'bg-gray-600 text-white'
                      : 'bg-primary/20 text-primary'
                  }`}
                >
                  {tournament.status.toUpperCase()}
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-muted">Entry: <span className="text-foreground font-medium">₹{tournament.entryFee}</span></p>
                <p className="text-muted">Slots: <span className="text-foreground font-medium">{tournament.joinedUsers?.length || 0}/{tournament.totalSlots}</span></p>
                <p className="text-muted">Match: <span className="text-foreground font-medium">{new Date(tournament.matchTime).toLocaleString()}</span></p>
                <p className="text-muted">Prize: <span className="text-primary font-medium">₹{tournament.prizeDistribution?.reduce((sum, p) => sum + p.prize, 0).toLocaleString()}</span></p>
              </div>
              <div className="flex gap-2 mt-4">
                <select
                  value={tournament.status}
                  onChange={(e) => handleStatusChange(tournament.id, e.target.value as any)}
                  className="flex-1 px-2 py-1 bg-background border border-border rounded text-sm text-foreground"
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="live">Live</option>
                  <option value="completed">Completed</option>
                </select>
                <button
                  onClick={() => openEditModal(tournament)}
                  className="px-3 py-1 bg-secondary/20 text-secondary rounded text-sm hover:bg-secondary hover:text-white transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(tournament.id)}
                  className="px-3 py-1 bg-red-600/20 text-red-400 rounded text-sm hover:bg-red-600 hover:text-white transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-foreground mb-4">
              {editingTournament ? 'Edit Tournament' : 'Create Tournament'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Game Name</label>
                <input
                  type="text"
                  value={formData.gameName}
                  onChange={(e) => setFormData({ ...formData, gameName: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                  placeholder="BGMI, Free Fire, etc."
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Entry Fee (₹)</label>
                  <input
                    type="number"
                    value={formData.entryFee}
                    onChange={(e) => setFormData({ ...formData, entryFee: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Total Slots</label>
                  <input
                    type="number"
                    value={formData.totalSlots}
                    onChange={(e) => setFormData({ ...formData, totalSlots: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Match Time</label>
                <input
                  type="datetime-local"
                  value={formData.matchTime}
                  onChange={(e) => setFormData({ ...formData, matchTime: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Room ID</label>
                  <input
                    type="text"
                    value={formData.roomId}
                    onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Room Password</label>
                  <input
                    type="text"
                    value={formData.roomPassword}
                    onChange={(e) => setFormData({ ...formData, roomPassword: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Prize Distribution
                </label>
                <p className="text-xs text-muted mb-1">Format: rank,prize|rank,prize|...</p>
                <input
                  type="text"
                  value={formData.prizeDistribution}
                  onChange={(e) => setFormData({ ...formData, prizeDistribution: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                  placeholder="1,1000|2,500|3,250|4,100|5,50"
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingTournament(null); }}
                  className="flex-1 px-4 py-2 bg-background border border-border rounded-lg text-foreground hover:bg-card transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 transition-colors"
                >
                  {submitting ? 'Saving...' : editingTournament ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}