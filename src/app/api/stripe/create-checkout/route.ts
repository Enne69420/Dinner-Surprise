import { NextRequest, NextResponse } from 'next/server';
import stripeInstance, { createCheckoutSession } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { priceId, userId, userEmail } = body;
    
    if (!priceId || !userId) {
      return NextResponse.json(
        { error: 'Price ID and User ID are required' },
        { status: 400 }
      );
    }
    
    // Ensure Stripe is properly initialized
    if (!stripeInstance) {
      return NextResponse.json(
        { error: 'Payment processing is currently unavailable' },
        { status: 500 }
      );
    }

    // Verify the price exists in Stripe
    try {
      const price = await stripeInstance.prices.retrieve(priceId);
      if (!price || price.active === false) {
        return NextResponse.json(
          { error: 'Selected price is not available' },
          { status: 400 }
        );
      }
    } catch (priceError: any) {
      return NextResponse.json(
        { error: 'Invalid price selected. Please try again.' },
        { status: 400 }
      );
    }
    
    // Use our helper function to create a checkout session
    const { sessionId, url } = await createCheckoutSession({
      priceId,
      userId,
      userEmail
    });
    
    if (!url) {
      return NextResponse.json(
        { error: 'Failed to create checkout session' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ url });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
} 