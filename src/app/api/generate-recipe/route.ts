import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/utils/supabase';

/**
 * Handler for the recipe generation API endpoint
 * This serves as a proxy to the Amplify function that contains the secret handling
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

      try {
        // Call the Amplify function using direct HTTP call
        // In production, this endpoint URL would be provided by Amplify after deploying the function
        const amplifyFunctionUrl = process.env.NEXT_PUBLIC_AMPLIFY_REST_ENDPOINT || '';
        
        if (!amplifyFunctionUrl) {
          throw new Error('Amplify function URL is not configured');
        }
        
        const response = await fetch(`${amplifyFunctionUrl}/generateRecipeFunction`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to call Amplify function: ${response.status} - ${errorText}`);
        }
        
        const result = await response.json();
        return NextResponse.json(result);
      } catch (amplifyError: any) {
        console.error('Error calling Amplify function:', amplifyError);
        
        return NextResponse.json(
          { 
            error: 'Failed to generate recipe',
            message: amplifyError.message || 'Unknown error'
          },
          { status: 500 }
        );
      }
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