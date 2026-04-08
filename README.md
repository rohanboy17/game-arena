# GameArena - Skill-Based eSports Tournament Platform

A premium web platform for skill-based eSports tournaments with role-based workflow and anti-cheat system.

## Features

- **Role-Based System**: User → Manager → Admin workflow
- **Anti-Cheat Verification**: 
  1. User submits result → status: pending
  2. Manager reviews → status: manager_approved
  3. Admin final review → status: approved (credits winnings)
- **User Roles**:
  - User: Join tournaments, submit results, manage wallet
  - Manager: Verify match results for assigned tournaments
  - Admin: Full platform control
- **Wallet System**: Manual UPI deposit/withdrawal
- **Tournament System**: Create, join, and manage tournaments
- **Referral System**: Earn bonus with referral codes

## Tech Stack

- **Frontend**: Next.js 16, Tailwind CSS
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage
- **Authentication**: Firebase Auth
- **Deployment**: Vercel (free)

## Quick Deploy

### Deploy to Vercel

1. Push code to GitHub
2. Go to [Vercel](https://vercel.com/)
3. Import repository
4. Add environment variables:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
   NEXT_PUBLIC_FIREBASE_PROJECT_ID
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
   NEXT_PUBLIC_FIREBASE_APP_ID
   ```
5. Deploy!

## Firebase Setup

1. Create project at [Firebase Console](https://console.firebase.google.com/)
2. Enable **Authentication** (Email/Password)
3. Enable **Firestore Database**
4. Enable **Storage**

## Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## Setting Roles

In Firestore, add field to user document:
- `role: "user"` - Regular user
- `role: "manager"` - Tournament manager
- `role: "admin"` - Platform admin

For manager, assign tournament with `assignedManagerId: user_id`.

## Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null;
    }
    match /tournaments/{tournamentId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    match /results/{resultId} {
      allow read, create: if request.auth != null;
      allow update: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['manager', 'admin'];
    }
    match /deposits/{depositId}, /withdrawals/{withdrawalId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

## Development

```bash
npm install
npm run dev
```

## Legal Disclaimer

This platform hosts skill-based eSports tournaments and is not affiliated with any game publisher.

## License

MIT