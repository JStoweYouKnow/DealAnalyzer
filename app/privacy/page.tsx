export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-8">Last Updated: {new Date().toLocaleDateString()}</p>

      <div className="space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mb-3">Overview</h2>
          <p>
            DealAnalyzer ("we", "our", or "us") respects your privacy and is committed to protecting your personal data.
            This privacy policy explains how we collect, use, and safeguard your information when you use our service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">Information We Collect</h2>
          <h3 className="text-xl font-medium mb-2">Gmail Data</h3>
          <p className="mb-3">
            When you connect your Gmail account, we access:
          </p>
          <ul className="list-disc list-inside space-y-1 mb-4">
            <li>Email messages matching your specified search criteria</li>
            <li>Email subject lines, sender information, and content</li>
            <li>Attachments from property deal emails</li>
          </ul>

          <h3 className="text-xl font-medium mb-2">Property Analysis Data</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>Property addresses and details you provide</li>
            <li>Financial metrics and analysis inputs</li>
            <li>Saved property comparisons and reports</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">How We Use Your Information</h2>
          <p className="mb-3">We use your information to:</p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Extract property data</strong>: Parse email content to identify real estate opportunities</li>
            <li><strong>Analyze investments</strong>: Calculate ROI, cash flow, and other financial metrics</li>
            <li><strong>Store your deals</strong>: Save email deals and analysis results for future reference</li>
            <li><strong>Improve our service</strong>: Understand usage patterns and enhance features</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">Data Storage and Security</h2>
          <p className="mb-3">
            We store your data using industry-standard security practices:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Data is stored in secure cloud databases (Convex)</li>
            <li>Gmail access tokens are encrypted and stored securely</li>
            <li>We use HTTPS encryption for all data transmission</li>
            <li>Access to user data is restricted to essential operations only</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">Data Sharing</h2>
          <p className="mb-3">
            We do NOT sell, trade, or rent your personal information to third parties.
          </p>
          <p className="mb-3">We may share data with:</p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>OpenAI</strong>: Email content is processed by OpenAI's API for property data extraction</li>
            <li><strong>Third-party APIs</strong>: Property data services (RentCast, ATTOM, Census) for market intelligence</li>
            <li><strong>Service providers</strong>: Infrastructure providers (Vercel, Convex) that help us operate our service</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">Your Rights</h2>
          <p className="mb-3">You have the right to:</p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Access</strong>: Request a copy of your data</li>
            <li><strong>Delete</strong>: Request deletion of your data at any time</li>
            <li><strong>Revoke</strong>: Disconnect your Gmail account from our service</li>
            <li><strong>Export</strong>: Download your analysis reports and saved deals</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">Gmail API Compliance</h2>
          <p className="mb-3">
            Our use of information received from Gmail APIs adheres to{' '}
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Google API Services User Data Policy
            </a>
            , including the Limited Use requirements.
          </p>
          <p className="mb-3">Specifically:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>We only access emails matching your specified search criteria</li>
            <li>Gmail data is used solely for property deal analysis</li>
            <li>We do not use Gmail data for advertising purposes</li>
            <li>Data is not shared with third parties except as disclosed above</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">Data Retention</h2>
          <p>
            We retain your data for as long as your account is active or as needed to provide services.
            You may request deletion of your data at any time by contacting us.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">Changes to This Policy</h2>
          <p>
            We may update this privacy policy from time to time. We will notify you of any changes by
            posting the new policy on this page and updating the "Last Updated" date.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">Contact Us</h2>
          <p className="mb-3">
            If you have questions about this privacy policy or our data practices, please contact us:
          </p>
          <ul className="list-none space-y-1">
            <li><strong>Email</strong>: support@yourdomain.com</li>
            <li><strong>Website</strong>: https://comfort-finder-analyzer.vercel.app</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
