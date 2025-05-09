import { NextRequest, NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not properly initialized' },
        { status: 500 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { priceId, userId } = body;

    if (!priceId || !userId) {
      return NextResponse.json(
        { error: 'Price ID and user ID are required' },
        { status: 400 }
      );
    }

    console.log('[Stripe Checkout] Creating checkout session for user:', userId, 'priceId:', priceId);

    // Create metadata with plan identification
    let planType = 'premium'; // Default to premium

    // Get the plan name from the product if available
    if (priceId) {
      try {
        const price = await stripe.prices.retrieve(priceId, {
          expand: ['product']
        });
        
        // Extract the product details to identify the plan type
        if (price.product && typeof price.product !== 'string') {
          const product = price.product as { name?: string };
          const productName = product.name?.toLowerCase() || '';
          if (productName.includes('family')) {
            planType = 'family';
          } else if (productName.includes('premium')) {
            planType = 'premium';
          }
        }
      } catch (priceError) {
        console.error('Error retrieving price details:', priceError);
        // Continue with default premium plan if price lookup fails
      }
    }

    // Add metadata to the checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || request.headers.get('origin')}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || request.headers.get('origin')}/subscribe`,
      metadata: {
        userId: userId,
        planType: planType  // Add plan type to metadata
      },
    });

    console.log('[Stripe Checkout] Successfully created checkout session:', {
      sessionId: session.id,
      url: session.url
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: any) {
    console.error('[Stripe Checkout] Error creating checkout session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
} 