'use client';

import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-green-700 mb-6">Privacy Policy</h1>
      
      <p className="text-gray-600 mb-8">
        Last updated: {new Date().toLocaleDateString('en-SE')}
      </p>

      <div className="prose prose-green max-w-none">
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-green-700 mb-4">1. Introduction</h2>
          <p>
            Dinner Surprise ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services.
          </p>
          <p>
            This policy is compliant with the General Data Protection Regulation (GDPR) and Swedish data protection laws. By using our service, you consent to the data practices described in this policy.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-green-700 mb-4">2. Data Controller</h2>
          <p>
            Dinner Surprise is the data controller for personal data collected through our website. If you have any questions about this Privacy Policy or our data practices, please contact us at:
          </p>
          <address className="not-italic">
            Email: privacy@dinnersurprise.com<br />
          </address>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-green-700 mb-4">3. Information We Collect</h2>
          
          <h3 className="text-lg font-medium text-green-600 mb-2">3.1 Personal Data</h3>
          <p>We may collect the following personal data:</p>
          <ul className="list-disc ml-6 mb-4">
            <li>Name</li>
            <li>Email address</li>
            <li>Billing information</li>
            <li>User preferences and dietary restrictions</li>
            <li>Account credentials</li>
          </ul>
          
          <h3 className="text-lg font-medium text-green-600 mb-2">3.2 Usage Data</h3>
          <p>We may also collect information about how you access and use our services:</p>
          <ul className="list-disc ml-6 mb-4">
            <li>IP address</li>
            <li>Browser type</li>
            <li>Pages visited</li>
            <li>Time and date of your visit</li>
            <li>Time spent on pages</li>
            <li>Recipe preferences</li>
            <li>Device information</li>
          </ul>
          
          <h3 className="text-lg font-medium text-green-600 mb-2">3.3 Cookies and Similar Technologies</h3>
          <p>
            We use cookies and similar tracking technologies to track activity on our website and store certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-green-700 mb-4">4. Legal Basis for Processing</h2>
          <p>We process your personal data on the following legal grounds:</p>
          <ul className="list-disc ml-6 mb-4">
            <li><strong>Contract fulfillment:</strong> Processing necessary to provide our services to you</li>
            <li><strong>Legitimate interests:</strong> To improve and personalize our services</li>
            <li><strong>Consent:</strong> Where you have specifically agreed to our use of your data</li>
            <li><strong>Legal obligation:</strong> Where we need to comply with a legal or regulatory obligation</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-green-700 mb-4">5. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul className="list-disc ml-6 mb-4">
            <li>Provide, maintain, and improve our services</li>
            <li>Process payments and manage your account</li>
            <li>Personalize your experience</li>
            <li>Communicate with you about our services</li>
            <li>Monitor and analyze usage patterns</li>
            <li>Detect, prevent, and address technical issues</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-green-700 mb-4">6. Data Retention</h2>
          <p>
            We will retain your personal data only for as long as necessary to fulfill the purposes for which it was collected, including to satisfy legal or reporting requirements.
          </p>
          <p>
            For users with an account, we store personal data until account deletion. Usage data may be kept in an anonymized form for statistical purposes.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-green-700 mb-4">7. Data Sharing and Disclosure</h2>
          <p>We may share your personal information with:</p>
          <ul className="list-disc ml-6 mb-4">
            <li><strong>Service providers:</strong> Third parties who provide services on our behalf (payment processors, hosting providers)</li>
            <li><strong>Regulatory authorities:</strong> Where required by law</li>
            <li><strong>Business transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
          </ul>
          <p>
            We do not sell your personal data to third parties.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-green-700 mb-4">8. Your Data Protection Rights</h2>
          <p>Under GDPR, you have the following rights:</p>
          <ul className="list-disc ml-6 mb-4">
            <li><strong>Right to access:</strong> You can request copies of your personal data</li>
            <li><strong>Right to rectification:</strong> You can request that we correct inaccurate data</li>
            <li><strong>Right to erasure:</strong> You can request that we delete your data</li>
            <li><strong>Right to restrict processing:</strong> You can request that we limit how we use your data</li>
            <li><strong>Right to data portability:</strong> You can request that we transfer your data to another organization</li>
            <li><strong>Right to object:</strong> You can object to our processing of your data</li>
            <li><strong>Rights related to automated decision making:</strong> You can request human intervention for decisions made automatically</li>
          </ul>
          <p>
            To exercise these rights, please contact us at privacy@dinnersurprise.com. We will respond to your request within 30 days.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-green-700 mb-4">9. International Data Transfers</h2>
          <p>
            Your information may be transferred to — and maintained on — computers located outside of your state, province, country or other governmental jurisdiction where the data protection laws may differ.
          </p>
          <p>
            When we transfer personal data outside the EU/EEA, we ensure a similar degree of protection is afforded to it by using specific contracts approved by the European Commission.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-green-700 mb-4">10. Data Security</h2>
          <p>
            We have implemented appropriate technical and organizational measures to protect your personal data against unauthorized or unlawful processing, accidental loss, destruction, or damage.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-green-700 mb-4">11. Children's Privacy</h2>
          <p>
            Our service is not intended for individuals under the age of 16. We do not knowingly collect personal data from children. If we discover that we have collected personal data from a child, we will delete this data immediately.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-green-700 mb-4">12. Changes to This Privacy Policy</h2>
          <p>
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "last updated" date.
          </p>
          <p>
            You are advised to review this Privacy Policy periodically for any changes.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-green-700 mb-4">13. Complaints</h2>
          <p>
            If you have a concern about our privacy practices, including the way we handled your personal data, you can report it to the Swedish Authority for Privacy Protection (IMY):
          </p>
          <p>
            <a href="https://www.imy.se/" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">
              Swedish Authority for Privacy Protection (IMY)
            </a>
          </p>
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