'use client';

import Link from 'next/link';

export default function CookiePolicyPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-green-700 mb-6">Cookie Policy</h1>
      
      <p className="text-gray-600 mb-8">
        Last updated: {new Date().toLocaleDateString('en-SE')}
      </p>

      <div className="prose prose-green max-w-none">
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-green-700 mb-4">1. Introduction</h2>
          <p>
            This Cookie Policy explains how Dinner Surprise ("we", "us", or "our") uses cookies and similar technologies on our website. This policy should be read alongside our Privacy Policy and Terms of Service.
          </p>
          <p>
            By using our website, you consent to the use of cookies in accordance with this Cookie Policy. If you do not agree with our use of cookies, you should set your browser settings accordingly or not use our website.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-green-700 mb-4">2. What Are Cookies</h2>
          <p>
            Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and provide information to the website owners.
          </p>
          <p>
            Cookies help us improve your experience on our website by:
          </p>
          <ul className="list-disc ml-6 mb-4">
            <li>Remembering your preferences and settings</li>
            <li>Understanding how you use our website</li>
            <li>Personalizing content and advertisements</li>
            <li>Enhancing site security and detecting fraud</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-green-700 mb-4">3. Types of Cookies We Use</h2>
          
          <h3 className="text-lg font-medium text-green-600 mb-2">3.1 Essential Cookies</h3>
          <p>
            These cookies are necessary for the website to function properly. They enable core functionality such as security, network management, and account access. You cannot opt out of these cookies.
          </p>
          <table className="min-w-full bg-white border border-gray-300 mb-4">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b">Cookie Name</th>
                <th className="py-2 px-4 border-b">Purpose</th>
                <th className="py-2 px-4 border-b">Duration</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-2 px-4 border-b">session_id</td>
                <td className="py-2 px-4 border-b">Maintains your session state</td>
                <td className="py-2 px-4 border-b">Session</td>
              </tr>
              <tr>
                <td className="py-2 px-4 border-b">XSRF-TOKEN</td>
                <td className="py-2 px-4 border-b">Security - prevents cross-site request forgery</td>
                <td className="py-2 px-4 border-b">Session</td>
              </tr>
            </tbody>
          </table>

          <h3 className="text-lg font-medium text-green-600 mb-2">3.2 Performance Cookies</h3>
          <p>
            These cookies collect information about how visitors use our website, such as which pages they visit most often and if they receive error messages. This data helps us improve our website's performance.
          </p>
          <table className="min-w-full bg-white border border-gray-300 mb-4">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b">Cookie Name</th>
                <th className="py-2 px-4 border-b">Purpose</th>
                <th className="py-2 px-4 border-b">Duration</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-2 px-4 border-b">_ga</td>
                <td className="py-2 px-4 border-b">Google Analytics - Distinguishes users</td>
                <td className="py-2 px-4 border-b">2 years</td>
              </tr>
              <tr>
                <td className="py-2 px-4 border-b">_gid</td>
                <td className="py-2 px-4 border-b">Google Analytics - Distinguishes users</td>
                <td className="py-2 px-4 border-b">24 hours</td>
              </tr>
            </tbody>
          </table>

          <h3 className="text-lg font-medium text-green-600 mb-2">3.3 Functionality Cookies</h3>
          <p>
            These cookies allow our website to remember choices you have made and provide enhanced, personalized features.
          </p>
          <table className="min-w-full bg-white border border-gray-300 mb-4">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b">Cookie Name</th>
                <th className="py-2 px-4 border-b">Purpose</th>
                <th className="py-2 px-4 border-b">Duration</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-2 px-4 border-b">user_preferences</td>
                <td className="py-2 px-4 border-b">Stores user preferences such as theme</td>
                <td className="py-2 px-4 border-b">1 year</td>
              </tr>
              <tr>
                <td className="py-2 px-4 border-b">language</td>
                <td className="py-2 px-4 border-b">Stores language preference</td>
                <td className="py-2 px-4 border-b">1 year</td>
              </tr>
            </tbody>
          </table>

          <h3 className="text-lg font-medium text-green-600 mb-2">3.4 Targeting/Advertising Cookies</h3>
          <p>
            These cookies are used to deliver advertisements more relevant to you and your interests. They are also used to limit the number of times you see an advertisement and help measure the effectiveness of advertising campaigns.
          </p>
          <table className="min-w-full bg-white border border-gray-300 mb-4">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b">Cookie Name</th>
                <th className="py-2 px-4 border-b">Purpose</th>
                <th className="py-2 px-4 border-b">Duration</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-2 px-4 border-b">_fbp</td>
                <td className="py-2 px-4 border-b">Facebook pixel - Used to deliver advertisements</td>
                <td className="py-2 px-4 border-b">3 months</td>
              </tr>
              <tr>
                <td className="py-2 px-4 border-b">ads_prefs</td>
                <td className="py-2 px-4 border-b">Stores advertisement preferences</td>
                <td className="py-2 px-4 border-b">1 year</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-green-700 mb-4">4. Third-Party Cookies</h2>
          <p>
            Some cookies are placed by third parties on our website. These third parties may include analytics providers (like Google), advertising networks, and social media platforms.
          </p>
          <p>
            We do not have control over these third-party cookies. You can check the privacy policies of these third parties to find out how they use cookies:
          </p>
          <ul className="list-disc ml-6 mb-4">
            <li><a href="https://policies.google.com/privacy" className="text-green-600 hover:underline" target="_blank" rel="noopener noreferrer">Google Analytics</a></li>
            <li><a href="https://www.facebook.com/policy.php" className="text-green-600 hover:underline" target="_blank" rel="noopener noreferrer">Facebook</a></li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-green-700 mb-4">5. Managing Cookies</h2>
          <p>
            Most web browsers allow you to manage your cookie preferences. You can set your browser to refuse cookies, or to alert you when cookies are being sent. The methods for doing so vary from browser to browser, and from version to version.
          </p>
          <p>
            Please note that if you choose to block cookies, you may not be able to use the full functionality of our website.
          </p>
          <p>
            You can find information on how to manage cookies in your browser at these websites:
          </p>
          <ul className="list-disc ml-6 mb-4">
            <li><a href="https://support.google.com/chrome/answer/95647" className="text-green-600 hover:underline" target="_blank" rel="noopener noreferrer">Google Chrome</a></li>
            <li><a href="https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop" className="text-green-600 hover:underline" target="_blank" rel="noopener noreferrer">Mozilla Firefox</a></li>
            <li><a href="https://support.apple.com/en-us/HT201265" className="text-green-600 hover:underline" target="_blank" rel="noopener noreferrer">Safari</a></li>
            <li><a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" className="text-green-600 hover:underline" target="_blank" rel="noopener noreferrer">Microsoft Edge</a></li>
          </ul>
          <p>
            For information on how to manage cookies on your mobile device, please consult your device's manual or manufacturer's website.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-green-700 mb-4">6. Cookie Consent</h2>
          <p>
            When you first visit our website, you will be shown a cookie banner asking for your consent to place non-essential cookies on your device. You can choose to accept all cookies, only essential cookies, or customize your preferences.
          </p>
          <p>
            You can change your cookie preferences at any time by clicking on the "Cookie Settings" link in the footer of our website.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-green-700 mb-4">7. Changes to This Cookie Policy</h2>
          <p>
            We may update our Cookie Policy from time to time. We will notify you of any changes by posting the new Cookie Policy on this page and updating the "Last updated" date at the top of this page.
          </p>
          <p>
            We encourage you to review this Cookie Policy periodically for any changes.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-green-700 mb-4">8. Contact Us</h2>
          <p>
            If you have any questions about our Cookie Policy, please contact us at:
          </p>
          <address className="not-italic">
            Email: privacy@dinnersurprise.com<br />
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