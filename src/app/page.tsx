'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="bg-(rgb(255 255 255)) rounded-2xl border border-gray-200 shadow-sm p-8 md:p-12">
        <div className="space-y-6 max-w-2xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-(rgb(var(--green-800)))">
            Turn Your Ingredients into Delicious Meals
          </h1>
          <p className="text-lg text-gray-700">
            Create recipes from what you already have. Enter your ingredients, 
            and we'll generate personalized recipes in seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/grocery-list" className="btn-primary text-center">
              Create Recipe Now
            </Link>
            <Link href="/subscribe" className="btn-secondary text-center">
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Environmental Impact Section */}
      <section className="py-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-(rgb(var(--green-700))) mb-4">Make an Environmental Impact</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Food waste is a major contributor to climate change. By using up your ingredients
            before they expire, you're helping create a more sustainable future.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="card text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-(rgb(var(--green-100))) p-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-(rgb(var(--green-600)))" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-(rgb(var(--green-700))) mb-2">Reduce CO2 Emissions</h3>
            <p className="text-gray-600">
              Food waste in landfills produces methane, a potent greenhouse gas. Using your ingredients prevents this.
            </p>
          </div>
          
          <div className="card text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-(rgb(var(--green-100))) p-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-(rgb(var(--green-600)))" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-(rgb(var(--green-700))) mb-2">Save Money</h3>
            <p className="text-gray-600">
              The average family wastes over $1,500 on food annually. Our app helps you use what you buy.
            </p>
          </div>
          
          <div className="card text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-(rgb(var(--green-100))) p-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-(rgb(var(--green-600)))" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-(rgb(var(--green-700))) mb-2">Conserve Resources</h3>
            <p className="text-gray-600">
              Growing food uses land, water, and energy. Using all your ingredients honors these resources.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-(rgb(var(--green-600))) mb-4">How It Works</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Turn your leftover ingredients into delicious meals in just a few easy steps.
          </p>
        </div>
        
        <div className="grid md:grid-cols-4 gap-8">
          {/* Step 1 */}
          <div className="card text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full border border-(rgb(var(--green-600))) p-3 h-16 w-16 flex items-center justify-center">
                <span className="text-2xl font-bold text-(rgb(var(--green-600)))">1</span>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-(rgb(var(--green-600))) mb-2">Add Your Ingredients</h3>
            <p className="text-gray-600">
              Enter the ingredients you have in your pantry, fridge, or those about to expire.
            </p>
          </div>
          
          {/* Step 2 */}
          <div className="card text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full border border-(rgb(var(--green-600))) p-3 h-16 w-16 flex items-center justify-center">
                <span className="text-2xl font-bold text-(rgb(var(--green-600)))">2</span>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-(rgb(var(--green-600))) mb-2">Select & Customize</h3>
            <p className="text-gray-600">
              Choose which ingredients to use and set preferences like serving size or dietary needs.
            </p>
          </div>
          
          {/* Step 3 */}
          <div className="card text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full border border-(rgb(var(--green-600))) p-3 h-16 w-16 flex items-center justify-center">
                <span className="text-2xl font-bold text-(rgb(var(--green-600)))">3</span>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-(rgb(var(--green-600))) mb-2">Generate Recipe</h3>
            <p className="text-gray-600">
              Our AI instantly creates a personalized recipe with detailed instructions for your ingredients.
            </p>
          </div>
          
          {/* Step 4 */}
          <div className="card text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full border border-(rgb(var(--green-600))) p-3 h-16 w-16 flex items-center justify-center">
                <span className="text-2xl font-bold text-(rgb(var(--green-600)))">4</span>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-(rgb(var(--green-600))) mb-2">Cook & Save</h3>
            <p className="text-gray-600">
              Follow the recipe, enjoy your meal, and save your favorites for future reference.
            </p>
          </div>
        </div>
        
        <div className="text-center mt-10">
          <Link href="/grocery-list" className="btn-primary py-3 px-8 text-lg">
            Try It Now
          </Link>
        </div>
      </section>
    </div>
  );
}
