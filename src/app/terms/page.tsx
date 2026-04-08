import AppLayout from '@/components/AppLayout';

export default function TermsPage() {
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-foreground mb-8">Terms & Conditions</h1>
        
        <div className="prose prose-invert max-w-none space-y-6">
          <section className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted">
              By accessing and using GameArena, you accept and agree to be bound by the terms and provision of this agreement.
            </p>
          </section>

          <section className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">2. Tournament Participation</h2>
            <p className="text-muted">
              All tournaments on this platform are skill-based competitions. By joining a tournament, you agree to:
            </p>
            <ul className="list-disc list-inside text-muted mt-2 space-y-2">
              <li>Play fairly and honestly</li>
              <li>Not use any cheats, hacks, or exploits</li>
              <li>Submit accurate match results</li>
              <li>Follow all game publisher rules and regulations</li>
            </ul>
          </section>

          <section className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">3. Financial Terms</h2>
            <p className="text-muted">
              This platform operates on a manual payment system. All deposits and withdrawals are processed by administrators.
              The platform reserves the right to hold payments for verification purposes.
            </p>
          </section>

          <section className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">4. Account Responsibilities</h2>
            <p className="text-muted">
              You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.
            </p>
          </section>

          <section className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">5. Prohibited Activities</h2>
            <p className="text-muted">The following activities are strictly prohibited:</p>
            <ul className="list-disc list-inside text-muted mt-2 space-y-2">
              <li>Multi-accounting (creating multiple accounts)</li>
              <li>Match fixing or collusion</li>
              <li>Using bots or automated scripts</li>
              <li>Harassment or abuse of other players or staff</li>
              <li>Any form of cheating or exploitation</li>
            </ul>
          </section>

          <section className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">6. Disclaimer</h2>
            <p className="text-muted">
              This platform is not affiliated with, endorsed, or sponsored by any game publisher including but not limited to 
              Krafton, Garena, or Riot Games. All tournaments are skill-based and no gambling is involved.
            </p>
          </section>

          <section className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">7. Changes to Terms</h2>
            <p className="text-muted">
              We reserve the right to modify these terms at any time. Continued use of the platform constitutes acceptance of any changes.
            </p>
          </section>
        </div>
      </div>
    </AppLayout>
  );
}