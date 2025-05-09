import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(req: NextRequest) {
  try {
    const { recipeId, userId } = await req.json();

    if (!recipeId || !userId) {
      return NextResponse.json(
        { error: 'Recipe ID and user ID are required' },
        { status: 400 }
      );
    }

    // First verify the recipe belongs to the user
    const { data: recipe, error: fetchError } = await supabase
      .from('recipes')
      .select('id')
      .eq('id', recipeId)
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      console.error('Error fetching recipe:', fetchError);
      return NextResponse.json(
        { error: 'Recipe not found or you do not have permission to delete it' },
        { status: 404 }
      );
    }

    // Delete the recipe
    const { error: deleteError } = await supabase
      .from('recipes')
      .delete()
      .eq('id', recipeId)
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Error deleting recipe:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete recipe' },
        { status: 500 }
      );
    }

    // Update the saved recipes count
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        saved_recipes_count: supabase.rpc('decrement_saved_recipes_count', { user_id: userId })
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating saved recipes count:', updateError);
      // Continue even if count update fails
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete recipe error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete recipe' },
      { status: 500 }
    );
  }
} 