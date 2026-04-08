export type UserRole = 'user' | 'manager' | 'admin';

export interface User {
  id: string;
  username: string;
  email: string;
  walletBalance: number;
  referralCode: string;
  referredBy?: string;
  role: UserRole;
  createdAt: string;
}

export interface DepositRequest {
  id: string;
  userId: string;
  username: string;
  amount: number;
  screenshotURL: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface WithdrawRequest {
  id: string;
  userId: string;
  username: string;
  amount: number;
  upiId: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface Tournament {
  id: string;
  gameName: string;
  gameImage?: string;
  entryFee: number;
  totalSlots: number;
  joinedUsers: string[];
  prizeDistribution: PrizeDistribution[];
  matchTime: string;
  roomId?: string;
  roomPassword?: string;
  assignedManagerId?: string;
  status: 'upcoming' | 'live' | 'completed';
  createdAt: string;
}

export interface PrizeDistribution {
  rank: number;
  prize: number;
}

export type ResultStatus = 'pending' | 'manager_approved' | 'approved' | 'rejected';

export interface Result {
  id: string;
  tournamentId: string;
  userId: string;
  username: string;
  kills: number;
  rank: number;
  screenshotURL: string;
  status: ResultStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'deposit' | 'entry' | 'winning' | 'withdrawal' | 'referral';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  description: string;
  createdAt: string;
}

export interface AdminConfig {
  upiId: string;
  upiName: string;
  referralBonus: number;
  minDeposit: number;
  minWithdraw: number;
  adminEmail: string;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  totalWinnings: number;
  tournamentsWon: number;
  rank: number;
}