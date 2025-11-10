export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
      <p className="text-sm text-muted-foreground mb-8">Last Updated: {new Date().toLocaleDateString()}</p>

      <div className="space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mb-3">Acceptance of Terms</h2>
          <p>
            By accessing and using DealAnalyzer ("the Service"), you accept and agree to be bound by these Terms of Service.
            If you do not agree to these terms, please do not use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">Description of Service</h2>
          <p className="mb-3">
            DealAnalyzer is a real estate investment analysis platform that helps you:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Analyze property investment opportunities</li>
            <li>Extract deal information from emails</li>
            <li>Calculate financial metrics (ROI, cash flow, cap rate)</li>
            <li>Compare multiple properties</li>
            <li>Access market intelligence data</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">User Responsibilities</h2>
          <p className="mb-3">You agree to:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Provide accurate information when using the Service</li>
            <li>Maintain the security of your account credentials</li>
            <li>Use the Service in compliance with all applicable laws</li>
            <li>Not use the Service for any unlawful or prohibited purpose</li>
            <li>Not attempt to gain unauthorized access to any part of the Service</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">Gmail Integration</h2>
          <p className="mb-3">
            When you connect your Gmail account:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>You grant us read-only access to emails matching your search criteria</li>
            <li>You can revoke access at any time through your Google Account settings</li>
            <li>We will only access emails for the purpose of extracting property deal information</li>
            <li>You are responsible for ensuring you have the right to share email content with us</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">Intellectual Property</h2>
          <p className="mb-3">
            You retain ownership of all data you input into the Service. We retain ownership of:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>The DealAnalyzer platform and software</li>
            <li>Analysis algorithms and methodologies</li>
            <li>Design, graphics, and branding</li>
            <li>Documentation and educational content</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">Disclaimers</h2>
          <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="font-semibold mb-2">IMPORTANT:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>This Service provides analysis tools, NOT investment advice</li>
              <li>Property valuations and financial projections are estimates only</li>
              <li>You should conduct your own due diligence before making investment decisions</li>
              <li>We are not responsible for the accuracy of third-party data sources</li>
              <li>Past performance does not guarantee future results</li>
              <li>Consult with qualified professionals before making investment decisions</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">Limitation of Liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, DEALANALYZER SHALL NOT BE LIABLE FOR ANY INDIRECT,
            INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES,
            WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER
            INTANGIBLE LOSSES RESULTING FROM YOUR USE OF THE SERVICE.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">Service Availability</h2>
          <p className="mb-3">
            We strive to provide reliable service but cannot guarantee:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Uninterrupted access to the Service</li>
            <li>Error-free operation</li>
            <li>Availability of third-party APIs and data sources</li>
            <li>Preservation of all data indefinitely</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">Modifications to Service</h2>
          <p>
            We reserve the right to modify or discontinue the Service (or any part thereof) at any time,
            with or without notice. We shall not be liable to you or any third party for any modification,
            suspension, or discontinuance of the Service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">Termination</h2>
          <p className="mb-3">
            We may terminate or suspend your access to the Service immediately, without prior notice, for:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Violation of these Terms of Service</li>
            <li>Fraudulent or illegal activity</li>
            <li>Abuse of the Service</li>
            <li>Non-payment of fees (if applicable)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">Privacy</h2>
          <p>
            Your use of the Service is also governed by our{' '}
            <a href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </a>
            . Please review it to understand how we collect, use, and protect your information.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">Changes to Terms</h2>
          <p>
            We reserve the right to modify these Terms of Service at any time. We will notify users of
            any material changes by posting the updated terms on this page and updating the "Last Updated" date.
            Your continued use of the Service after such changes constitutes acceptance of the new terms.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of the United States,
            without regard to its conflict of law provisions.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">Contact Information</h2>
          <p className="mb-3">
            For questions about these Terms of Service, please contact us:
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
