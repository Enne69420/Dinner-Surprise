'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function ContactPage() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: user?.email || '',
    subject: 'Payment Issue',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // For now, just simulate a successful submission
      // In production, you would connect this to a real API endpoint
      console.log('Form submission:', formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSubmitSuccess(true);
      setFormData({
        name: '',
        email: user?.email || '',
        subject: 'Payment Issue',
        message: ''
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitError('There was an error submitting your message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-12 px-4 max-w-3xl">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <h1 className="text-3xl font-bold mb-6 text-[rgb(var(--green-800))]">Contact Support</h1>
        
        {!submitSuccess ? (
          <>
            <p className="text-gray-600 mb-8">
              Having trouble with your subscription or need assistance with our services? 
              Fill out the form below and our support team will get back to you as soon as possible.
            </p>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[rgb(var(--green-500))] focus:border-transparent"
                  placeholder="Your name"
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[rgb(var(--green-500))] focus:border-transparent"
                  placeholder="you@example.com"
                />
              </div>
              
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[rgb(var(--green-500))] focus:border-transparent"
                >
                  <option value="Payment Issue">Payment Issue</option>
                  <option value="Subscription Problem">Subscription Problem</option>
                  <option value="Account Access">Account Access</option>
                  <option value="Feature Request">Feature Request</option>
                  <option value="General Question">General Question</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[rgb(var(--green-500))] focus:border-transparent"
                  placeholder="Please describe your issue or question in detail..."
                />
              </div>
              
              {submitError && (
                <div className="p-4 bg-red-50 text-red-700 rounded-md">
                  {submitError}
                </div>
              )}
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-[rgb(var(--green-600))] text-white rounded-md hover:bg-[rgb(var(--green-700))] disabled:opacity-50"
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-[rgb(var(--green-100))] rounded-full flex items-center justify-center mx-auto mb-6">
              <svg 
                className="w-10 h-10 text-[rgb(var(--green-600))]" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold mb-4 text-[rgb(var(--green-800))]">Message Sent!</h2>
            <p className="text-gray-600 mb-8">
              Thank you for reaching out. Our support team will review your message and respond to your email as soon as possible.
            </p>
            
            <div className="flex justify-center space-x-4">
              <Link
                href="/dashboard"
                className="px-6 py-2 bg-[rgb(var(--green-600))] text-white rounded-md hover:bg-[rgb(var(--green-700))]"
              >
                Go to Dashboard
              </Link>
              <button
                onClick={() => setSubmitSuccess(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Send Another Message
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 