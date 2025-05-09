import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with admin privileges
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get the user's grocery list
    const { data: groceryList, error: listError } = await supabase
      .from('grocery_lists')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (listError) {
      if (listError.code === 'PGRST116') {
        // No grocery list found for this user
        return NextResponse.json({ items: [] });
      }
      
      return NextResponse.json(
        { error: 'Failed to fetch grocery list' },
        { status: 500 }
      );
    }

    return NextResponse.json(groceryList);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch grocery list' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { items, userId } = await req.json();

    if (!items || !userId) {
      return NextResponse.json(
        { error: 'Items and userId are required' },
        { status: 400 }
      );
    }
    
    // Check if items is a valid array
    if (!Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Items must be an array' },
        { status: 400 }
      );
    }

    // First check if user already has a grocery list
    const { data: existingList, error: checkError } = await supabase
      .from('grocery_lists')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      return NextResponse.json(
        { error: 'Failed to check existing grocery list' },
        { status: 500 }
      );
    }

    let result;

    if (existingList) {
      // Update existing list
      const { data, error } = await supabase
        .from('grocery_lists')
        .update({
          items: items,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select();

      if (error) {
        return NextResponse.json(
          { error: 'Failed to update grocery list' },
          { status: 500 }
        );
      }

      result = data;
    } else {
      // Create new list
      const { data, error } = await supabase
        .from('grocery_lists')
        .insert({
          user_id: userId,
          items: items,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();

      if (error) {
        return NextResponse.json(
          { error: 'Failed to create grocery list' },
          { status: 500 }
        );
      }

      result = data;
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to save grocery list' },
      { status: 500 }
    );
  }
} 