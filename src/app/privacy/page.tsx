import AppLayout from '@/components/AppLayout';

export default function PrivacyPage() {
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-foreground mb-8">Privacy Policy</h1>
        
        <div className="prose prose-invert max-w-none space-y-6">
          <section className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">1. Information We Collect</h2>
            <p className="text-muted">
              We collect information you provide when creating an account, including your username, email address, 
              and payment information for deposits and withdrawals.
            </p>
          </section>

          <section className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">2. How We Use Your Information</h2>
            <p className="text-muted">Your information is used to:</p>
            <ul className="list-disc list-inside text-muted mt-2 space-y-2">
              <li>Provide and maintain our services</li>
              <li>Process your tournament registrations and payments</li>
              <li>Communicate with you about tournaments and updates</li>
              <li>Verify your identity for security purposes</li>
            </ul>
          </section>

          <section className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">3. Data Storage</h2>
            <p className="text-muted">
              All your personal data and transaction history are stored securely in our database. 
              We use industry-standard security measures to protect your information.
            </p>
          </section>

          <section className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">4. Information Sharing</h2>
            <p className="text-muted">
              We do not sell or share your personal information with third parties except as necessary 
              to process payments and comply with legal obligations.
            </p>
          </section>

          <section className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">5. Cookies</h2>
            <p className="text-muted">
              We use cookies to enhance your experience. You can control cookies through your browser settings.
            </p>
          </section>

          <section className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">6. Your Rights</h2>
            <p className="text-muted">
              You have the right to access, update, or delete your personal information. 
              Contact our support team to exercise these rights.
            </p>
          </section>

          <section className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">7. Contact Us</h2>
            <p className="text-muted">
              If you have any questions about this Privacy Policy, please contact us through the platform.
            </p>
          </section>
        </div>
      </div>
    </AppLayout>
  );
}