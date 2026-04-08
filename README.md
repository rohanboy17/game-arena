# GameArena - Skill-Based eSports Tournament Platform

A complete MVP web platform for skill-based eSports tournaments with a 100% FREE setup.

## Features

- **User Authentication**: Email/password signup and login via Firebase Auth
- **Wallet System**: Manual deposit/withdraw with UPI payment
- **Tournament System**: Create and join tournaments
- **Match Flow**: Room details visible 10 minutes before match
- **Result Submission**: Anti-cheat screenshot upload with kills/rank
- **Admin Panel**: Full control over users, tournaments, deposits, withdrawals, and results
- **Referral System**: Earn bonus when using referral codes

## Tech Stack

- **Frontend**: Next.js 16, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage
- **Authentication**: Firebase Auth

## Getting Started

### Prerequisites

- Node.js 18+
- Firebase Project (Free tier)

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable **Authentication** (Email/Password provider)
4. Enable **Firestore Database**
5. Enable **Storage**
6. Copy your Firebase config credentials

### 2. Environment Setup

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Admin Setup

To make a user an admin:

1. Open Firestore Console
2. Find the user document
3. Add field `isAdmin: true`

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin panel pages
│   ├── dashboard/         # User dashboard
│   ├── tournaments/       # Tournament pages
│   ├── wallet/           # Wallet management
│   ├── login/            # Login page
│   ├── signup/           # Signup page
│   ├── terms/            # Terms & Conditions
│   ├── privacy/          # Privacy Policy
│   └── page.tsx         # Home page (tournament list)
├── components/            # Reusable components
├── lib/                   # Firebase config, utilities
└── types/                 # TypeScript interfaces
```

## Firebase Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read their own data
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    
    // Tournament rules
    match /tournaments/{tournamentId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
    
    // Results rules
    match /results/{resultId} {
      allow read, create: if request.auth != null;
      allow update: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
    
    // Wallet request rules
    match /depositRequests/{requestId}, /withdrawRequests/{requestId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
    
    // Transactions rules
    match /transactions/{transactionId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
  }
}
```

## Firebase Storage Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

## Deployment

### Deploy to Vercel (Free)

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com/)
3. Import your repository
4. Add the environment variables in Vercel settings
5. Deploy!

## Legal Disclaimer

This platform hosts skill-based eSports tournaments and is not affiliated with any game publisher. No gambling is involved. All tournaments are based on skill and fair play.

## License

MIT
