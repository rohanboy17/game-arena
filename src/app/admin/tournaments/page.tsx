'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useNotification } from '@/lib/notification-context';
import { Tournament, PrizeDistribution, User } from '@/types';
import { getDocuments, addDocument, updateDocument, deleteDocument, COLLECTIONS } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Trophy,
  Loader2,
  Gamepad2,
  Copy,
  Check
} from 'lucide-react';

export default function AdminTournamentsPage() {
  const router = useRouter();
  const { user, userData, loading: authLoading, isAdmin } = useAuth();
  const { addNotification } = useNotification();
  
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [users, setUsers] = useState<User[]>([]);
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
    assignedManagerId: '',
  });

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
      const [tournamentsData, usersData] = await Promise.all([
        getDocuments<Tournament>(COLLECTIONS.TOURNAMENTS),
        getDocuments<User>(COLLECTIONS.USERS),
      ]);
      setTournaments(tournamentsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setUsers(usersData.filter(u => u.role === 'manager' || u.role === 'user'));
    } catch (error) {
      console.error('Error:', error);
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
        assignedManagerId: formData.assignedManagerId || null,
        joinedUsers: editingTournament?.joinedUsers || [],
        status: 'upcoming' as const,
        createdAt: editingTournament?.createdAt || new Date().toISOString(),
      };

      if (editingTournament) {
        await updateDocument(COLLECTIONS.TOURNAMENTS, editingTournament.id, tournamentData);
        toast.success('Tournament updated!');
      } else {
        await addDocument(COLLECTIONS.TOURNAMENTS, tournamentData);
        toast.success('Tournament created!');
      }

      setShowModal(false);
      setEditingTournament(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to save tournament');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this tournament?')) return;
    try {
      await deleteDocument(COLLECTIONS.TOURNAMENTS, id);
      toast.success('Tournament deleted');
      loadData();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const handleStatusChange = async (id: string, status: 'upcoming' | 'live' | 'completed') => {
    try {
      await updateDocument(COLLECTIONS.TOURNAMENTS, id, { status });
      toast.success(`Marked as ${status}`);
      loadData();
    } catch (error) {
      toast.error('Failed to update');
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
      assignedManagerId: '',
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
      assignedManagerId: tournament.assignedManagerId || '',
    });
    setShowModal(true);
  };

  const managers = users.filter(u => u.role === 'manager');

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-purple-950/5 to-background">
      <div className="border-b bg-card/50 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-muted-foreground hover:text-foreground">← Back</Link>
              <div>
                <h1 className="text-2xl font-bold">Tournaments</h1>
                <p className="text-muted-foreground">{tournaments.length} total</p>
              </div>
            </div>
            <Button 
              className="bg-gradient-to-r from-primary to-purple-600"
              onClick={() => { resetForm(); setEditingTournament(null); setShowModal(true); }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Tournament
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tournaments.map((tournament) => (
            <Card key={tournament.id} className="border-border/50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Gamepad2 className="h-5 w-5 text-primary" />
                    {tournament.gameName}
                  </CardTitle>
                  <Badge className={
                    tournament.status === 'live' ? 'bg-red-500' :
                    tournament.status === 'completed' ? 'bg-gray-500' :
                    'bg-primary/20 text-primary'
                  }>{tournament.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Entry Fee</span>
                    <span className="font-bold text-accent">₹{tournament.entryFee}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Slots</span>
                    <span className="font-bold">{tournament.joinedUsers?.length || 0}/{tournament.totalSlots}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Prize Pool</span>
                    <span className="font-bold text-primary">
                      ₹{tournament.prizeDistribution?.reduce((sum, p) => sum + p.prize, 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Match Time</span>
                    <span className="text-xs">{new Date(tournament.matchTime).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <select
                    value={tournament.status}
                    onChange={(e) => handleStatusChange(tournament.id, e.target.value as any)}
                    className="flex-1 px-2 py-1 text-sm bg-background border rounded"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="live">Live</option>
                    <option value="completed">Completed</option>
                  </select>
                  <Button size="sm" variant="outline" onClick={() => openEditModal(tournament)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(tournament.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTournament ? 'Edit Tournament' : 'Create Tournament'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Game Name</Label>
                <Input
                  value={formData.gameName}
                  onChange={(e) => setFormData({ ...formData, gameName: e.target.value })}
                  placeholder="BGMI, Free Fire"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Entry Fee (₹)</Label>
                <Input
                  type="number"
                  value={formData.entryFee}
                  onChange={(e) => setFormData({ ...formData, entryFee: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Total Slots</Label>
                <Input
                  type="number"
                  value={formData.totalSlots}
                  onChange={(e) => setFormData({ ...formData, totalSlots: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Match Time</Label>
                <Input
                  type="datetime-local"
                  value={formData.matchTime}
                  onChange={(e) => setFormData({ ...formData, matchTime: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Room ID</Label>
                <Input
                  value={formData.roomId}
                  onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Room Password</Label>
                <Input
                  value={formData.roomPassword}
                  onChange={(e) => setFormData({ ...formData, roomPassword: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Assign Manager (Optional)</Label>
              <select
                value={formData.assignedManagerId}
                onChange={(e) => setFormData({ ...formData, assignedManagerId: e.target.value })}
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                <option value="">No Manager</option>
                {managers.map((m) => (
                  <option key={m.id} value={m.id}>{m.username}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Prize Distribution (rank,prize|...)</Label>
              <Input
                value={formData.prizeDistribution}
                onChange={(e) => setFormData({ ...formData, prizeDistribution: e.target.value })}
                placeholder="1,1000|2,500|3,250"
                required
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-gradient-to-r from-primary to-purple-600" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : editingTournament ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}