import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/utils/supabase';

/**
 * Handler for the recipe generation API endpoint
 * This now serves as a proxy to the Amplify function that contains the secret handling
 */
export async function POST(req: NextRequest) {
  try {
    // Get request data
    const requestData = await req.json();
    const { ingredients, servings, userId } = requestData;

    // Basic validation
    if (!ingredients || ingredients.length === 0) {
      return NextResponse.json(
        { error: 'Ingredients are required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    try {
      // Create server-side Supabase client
      const supabase = createServerSupabaseClient();
      
      // Check user existence first
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        return NextResponse.json(
          { error: `Failed to fetch user profile: ${profileError.message}` },
          { status: 500 }
        );
      }

      // Call AWS Lambda Function (Amplify function)
      // In production, we would use AWS SDK to invoke the Lambda directly,
      // or use API Gateway to create a secure endpoint to the function
      
      // For demonstration purposes, we'll call the function through API Gateway
      // The actual implementation would depend on your specific Amplify setup
      const LAMBDA_API_ENDPOINT = process.env.NEXT_PUBLIC_API_ENDPOINT + '/generate-recipe';
      
      const response = await fetch(LAMBDA_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return NextResponse.json(
          { error: errorData.error || 'Failed to generate recipe', ...errorData },
          { status: response.status }
        );
      }
      
      const data = await response.json();
      return NextResponse.json(data);
      
    } catch (error: any) {
      console.error('Error in recipe generation API:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to process request' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Unexpected error in API route:', error);
    return NextResponse.json(
      { error: 'Invalid request format' },
      { status: 400 }
    );
  }
} 