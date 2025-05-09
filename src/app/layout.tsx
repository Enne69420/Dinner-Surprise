import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";
import { AuthProvider } from "@/context/AuthContext";
import Link from "next/link";
import CookieBanner from "@/components/CookieBanner";
import SubscriptionInitializer from "@/components/SubscriptionInitializer";
import { configureAmplify } from "@/lib/amplify";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Dinner Surprise - Reduce Food Waste",
  description: "Generate recipes from your ingredients before they expire",
};

// Check for environment variables at startup for debugging
const checkEnvVariables = () => {
  if (typeof window === 'undefined') {
    // Only log on server
    console.log('Environment Variables Check (server-side):');
    
    // Stripe variables
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    
    console.log('STRIPE_SECRET_KEY:', stripeSecretKey ? '✓ Set' : '✗ Missing');
    console.log('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:', stripePublishableKey ? '✓ Set' : '✗ Missing');
    console.log('NEXT_PUBLIC_PRICE_ID_PREMIUM_MONTHLY:', process.env.NEXT_PUBLIC_PRICE_ID_PREMIUM_MONTHLY ? '✓ Set' : '✗ Missing');
    
    // Check key types
    if (stripeSecretKey) {
      const isTestKey = stripeSecretKey.startsWith('sk_test_');
      console.log('STRIPE_SECRET_KEY type:', isTestKey ? 'TEST KEY' : 'LIVE KEY');
    }
    
    if (stripePublishableKey) {
      const isTestKey = stripePublishableKey.startsWith('pk_test_');
      console.log('STRIPE_PUBLISHABLE_KEY type:', isTestKey ? 'TEST KEY' : 'LIVE KEY');
    }
    
    // Check for mismatch
    if (stripeSecretKey && stripePublishableKey) {
      const secretIsTest = stripeSecretKey.startsWith('sk_test_');
      const publishableIsTest = stripePublishableKey.startsWith('pk_test_');
      
      if (secretIsTest !== publishableIsTest) {
        console.error('⚠️ CRITICAL ERROR: Mismatched Stripe key types. Both keys must be either test or live.');
      }
    }
  }
};

// Call it immediately
checkEnvVariables();

// Initialize Amplify on client side
if (typeof window !== 'undefined') {
  configureAmplify();
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-(rgb(255 255 255)) flex flex-col min-h-screen`}>
        <AuthProvider>
          <Navbar />
          <SubscriptionInitializer />
          <main className="container mx-auto px-4 py-8 flex-grow">
            {children}
          </main>
          <footer className="py-8 border-t border-(rgb(var(--green-600)/20)) mt-auto">
            <div className="container mx-auto px-4">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <div className="mb-4 md:mb-0">
                  <h3 className="text-xl font-bold text-(rgb(var(--green-600))) mb-2">Dinner Surprise</h3>
                  <p className="text-gray-600">Helping reduce food waste one recipe at a time</p>
                </div>
                <div className="flex flex-col md:flex-row gap-6 md:items-center">
                  <div>
                    <h4 className="font-medium text-(rgb(var(--green-600))) mb-2">Quick Links</h4>
                    <ul className="space-y-1">
                      <li><Link href="/" className="text-gray-600 hover:text-(rgb(var(--green-600)))">Home</Link></li>
                      <li><Link href="/recipes" className="text-gray-600 hover:text-(rgb(var(--green-600)))">Recipes</Link></li>
                      <li><Link href="/grocery-list" className="text-gray-600 hover:text-(rgb(var(--green-600)))">Recipe Generator</Link></li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-(rgb(var(--green-600))) mb-2">About</h4>
                    <ul className="space-y-1">
                      <li><Link href="/subscribe" className="text-gray-600 hover:text-(rgb(var(--green-600)))">Pricing</Link></li>
                      <li><Link href="/privacy" className="text-gray-600 hover:text-(rgb(var(--green-600)))">Privacy Policy</Link></li>
                      <li><Link href="/terms" className="text-gray-600 hover:text-(rgb(var(--green-600)))">Terms of Service</Link></li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </footer>
          <div className="py-4 text-center text-sm text-gray-500">
            <p>© {new Date().getFullYear()} Dinner Surprise. All rights reserved.</p>
            <p className="mt-2">Contact us: <a href="mailto:dinnersurprise@gmail.com" className="text-(rgb(var(--green-600))) hover:underline">dinnersurprise@gmail.com</a></p>
          </div>
          <CookieBanner />
        </AuthProvider>
      </body>
    </html>
  );
}
