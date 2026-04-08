'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { User } from '@/types';
import { getDocuments, COLLECTIONS, updateDocument } from '@/lib/db';

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, userData, loading: authLoading } = useAuth();
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || !userData?.isAdmin)) {
      router.push('/');
    }
  }, [user, userData, authLoading, router]);

  useEffect(() => {
    if (user && userData?.isAdmin) {
      loadUsers();
    }
  }, [user, userData]);

  const loadUsers = async () => {
    try {
      const data = await getDocuments<User>(COLLECTIONS.USERS);
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.referralCode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-primary hover:underline">← Back</Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Manage Users</h1>
              <p className="text-muted">{users.length} total users</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by username, email, or referral code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-96 px-4 py-3 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
          />
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-background">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Username</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Wallet</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Referral Code</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Joined</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id} className="border-t border-border">
                  <td className="px-4 py-3 text-foreground font-medium">{u.username}</td>
                  <td className="px-4 py-3 text-muted text-sm">{u.email}</td>
                  <td className="px-4 py-3 text-primary font-bold">₹{u.walletBalance?.toFixed(2) || '0.00'}</td>
                  <td className="px-4 py-3 text-accent text-sm">{u.referralCode}</td>
                  <td className="px-4 py-3 text-muted text-sm">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}