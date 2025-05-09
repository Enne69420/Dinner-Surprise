'use client';

import Link from 'next/link';

export default function TermsOfServicePage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-green-700 mb-6">Terms of Service</h1>
      
      <p className="text-gray-600 mb-8">
        Last updated: {new Date().toLocaleDateString('en-SE')}
      </p>

      <div className="prose prose-green max-w-none">
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-green-700 mb-4">1. Introduction</h2>
          <p>
            Welcome to Dinner Surprise. These Terms of Service (&quot;Terms&quot;) govern your use of our website and services (collectively, the &quot;Service&quot;), operated by Dinner Surprise (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;).
          </p>
          <p>
            By accessing or using our Service, you agree to be bound by these Terms. If you disagree with any part of the Terms, you may not use our Service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-green-700 mb-4">2. Definitions</h2>
          <ul className="list-disc ml-6 mb-4">
            <li><strong>User:</strong> Any individual who accesses or uses our Service.</li>
            <li><strong>Content:</strong> Recipes, articles, images, videos, and other material available through our Service.</li>
            <li><strong>User Content:</strong> Any content, including recipes, images, or comments, that users submit, upload, or post to our Service.</li>
            <li><strong>Subscription:</strong> Premium access to our Service that may be purchased under various plans.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-green-700 mb-4">3. Account Registration</h2>
          <p>
            To access certain features of our Service, you may be required to register for an account. You must provide accurate, current, and complete information during the registration process and keep your account information up-to-date.
          </p>
          <p>
            You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your account. You agree not to disclose your password to any third party.
          </p>
          <p>
            We reserve the right to disable any user account if we believe you have violated any provision of these Terms.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-green-700 mb-4">4. Subscriptions and Payments</h2>
          <p>
            Some parts of the Service are offered on a subscription basis. Payment for subscriptions will be charged to your chosen payment method at the confirmation of purchase.
          </p>
          <h3 className="text-lg font-medium text-green-600 mb-2">4.1 Subscription Plans</h3>
          <p>
            We offer various subscription plans, including Free, Premium, and Family plans. The features included in each plan are described on our subscription page.
          </p>
          <h3 className="text-lg font-medium text-green-600 mb-2">4.2 Billing Cycle</h3>
          <p>
            Subscriptions are automatically renewed unless canceled before the renewal date. You can cancel your subscription at any time through your account settings.
          </p>
          <h3 className="text-lg font-medium text-green-600 mb-2">4.3 Refunds</h3>
          <p>
            Refund requests will be evaluated on a case-by-case basis. Contact our customer support for refund inquiries.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-green-700 mb-4">5. User Content</h2>
          <p>
            By posting or submitting content to our Service, you grant us a worldwide, non-exclusive, royalty-free, transferable license to use, reproduce, distribute, prepare derivative works of, display, and perform your content in connection with the Service.
          </p>
          <p>
            You represent and warrant that your content does not violate the rights of any third party, including copyright, trademark, privacy, or other personal or proprietary rights.
          </p>
          <p>
            We reserve the right to remove any content that violates these Terms or that we find objectionable for any reason, without prior notice.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-green-700 mb-4">6. Intellectual Property</h2>
          <p>
            The Service and its original content, features, and functionality are and will remain the exclusive property of Dinner Surprise and its licensors.
          </p>
          <p>
            Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of Dinner Surprise.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-green-700 mb-4">7. Prohibited Uses</h2>
          <p>You agree not to use the Service:</p>
          <ul className="list-disc ml-6 mb-4">
            <li>In any way that violates any applicable national or international law or regulation.</li>
            <li>To transmit, or procure the sending of, any advertising or promotional material, including any "junk mail", "chain letter," "spam," or any other similar solicitation.</li>
            <li>To impersonate or attempt to impersonate Dinner Surprise, a Dinner Surprise employee, another user, or any other person or entity.</li>
            <li>To engage in any other conduct that restricts or inhibits anyone's use or enjoyment of the Service, or which may harm Dinner Surprise or users of the Service.</li>
            <li>To attempt to gain unauthorized access to, interfere with, damage, or disrupt any parts of the Service, the server on which the Service is stored, or any server, computer, or database connected to the Service.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-green-700 mb-4">8. Limitation of Liability</h2>
          <p>
            In no event shall Dinner Surprise, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from:
          </p>
          <ul className="list-disc ml-6 mb-4">
            <li>Your access to or use of or inability to access or use the Service;</li>
            <li>Any conduct or content of any third party on the Service;</li>
            <li>Any content obtained from the Service; and</li>
            <li>Unauthorized access, use or alteration of your transmissions or content.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-green-700 mb-4">9. Disclaimer</h2>
          <p>
            Your use of the Service is at your sole risk. The Service is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis. The Service is provided without warranties of any kind, whether express or implied.
          </p>
          <p>
            We don&apos;t warrant that the Service will be uninterrupted, timely, secure, or error-free, or that any defects will be corrected.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-green-700 mb-4">10. Governing Law</h2>
          <p>
            These Terms shall be governed and construed in accordance with the laws of Sweden, without regard to its conflict of law provisions.
          </p>
          <p>
            Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights. If any provision of these Terms is held to be invalid or unenforceable by a court, the remaining provisions of these Terms will remain in effect.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-green-700 mb-4">11. Changes to Terms</h2>
          <p>
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide notice of any changes by updating the "last updated" date at the top of this page.
          </p>
          <p>
            By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms. If you do not agree to the new terms, please stop using the Service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-green-700 mb-4">12. Contact Us</h2>
          <p>
            If you have any questions about these Terms, please contact us at:
          </p>
          <address className="not-italic">
            Email: legal@dinnersurprise.com<br />
          </address>
        </section>
      </div>

      <div className="mt-12 text-center">
        <Link href="/" className="text-green-600 hover:underline">
          Return to Home
        </Link>
      </div>
    </div>
  );
} 