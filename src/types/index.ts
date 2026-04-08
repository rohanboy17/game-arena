export interface User {
  id: string;
  username: string;
  email: string;
  walletBalance: number;
  referralCode: string;
  referredBy?: string;
  createdAt: string;
  isAdmin?: boolean;
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
  status: 'upcoming' | 'live' | 'completed';
  createdAt: string;
}

export interface PrizeDistribution {
  rank: number;
  prize: number;
}

export interface Result {
  id: string;
  tournamentId: string;
  userId: string;
  username: string;
  kills: number;
  rank: number;
  screenshotURL: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'deposit' | 'entry' | 'winning' | 'withdrawal';
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
