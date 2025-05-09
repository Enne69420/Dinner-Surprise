import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for admin operations
const serviceRoleSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Force dynamic rendering to always get fresh data
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // Get cookies from the request to authenticate
    const requestUrl = new URL(req.url);
    const cookieString = req.headers.get('cookie') || '';
    const { recipe, userId } = await req.json();

    console.log('Starting recipe save process for user:', userId);
    
    if (!recipe) {
      return NextResponse.json(
        { error: 'Recipe data is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Verify that the user exists in the profiles table
    const { data: profile, error: profileError } = await serviceRoleSupabase
      .from('profiles')
      .select('saved_recipes_count, tier')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
    }

    if (!profile) {
      console.error('No profile found for user:', userId);
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    console.log('Found user profile with tier:', profile.tier);

    // Check user_subscriptions table for plan information
    const { data: subscription, error: subError } = await serviceRoleSupabase
      .from('user_subscriptions')
      .select('plan_type')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (subError) {
      console.warn('Error fetching subscription, will use profile tier:', subError);
    }
    
    // Determine recipe limit based on tier
    // Prefer subscription.plan_type if available, otherwise use profile.tier
    const userTier = (subscription && subscription.plan_type) || profile.tier;
    const savedRecipesLimit = (userTier === 'premium' || userTier === 'family') ? 100 : 5;
    
    console.log('User tier:', userTier, 'Recipe limit:', savedRecipesLimit, 'Current saved count:', profile.saved_recipes_count);
    
    if (profile.saved_recipes_count >= savedRecipesLimit) {
      return NextResponse.json(
        { error: 'You have reached your saved recipes limit. Please upgrade to premium for more storage.' },
        { status: 403 }
      );
    }

    // Format ingredients data
    let ingredientsData = recipe.ingredients;
    
    // Function to parse ingredient strings into proper objects
    const parseIngredientString = (str: string) => {
      // Common pattern: "200g pasta" or "2 cloves garlic" or "1/2 cup milk"
      // Try to extract amount, unit, and name
      const amountUnitPattern = /^([\d\/\.\s]+)?\s*([a-zA-Z]+|cloves|slices|pieces)?\s*(.+)$/;
      const match = str.match(amountUnitPattern);
      
      if (match) {
        const [_, amount, unit, name] = match;
        return {
          name: name.trim(),
          amount: amount ? amount.trim() : '',
          unit: unit ? unit.trim() : ''
        };
      }
      
      // If we can't parse it, just return the string as the name
      return {
        name: str,
        amount: '',
        unit: ''
      };
    };
    
    // Handle different formats of ingredient data
    if (Array.isArray(ingredientsData)) {
      // If it's already an array, process each item
      ingredientsData = ingredientsData.map(ingredient => {
        if (typeof ingredient === 'string') {
          // Try to parse string JSON if it looks like JSON
          if (ingredient.trim().startsWith('{') && ingredient.trim().endsWith('}')) {
            try {
              const parsed = JSON.parse(ingredient);
              if (parsed.name && (parsed.amount === "" && parsed.unit === "")) {
                // If name has amount/unit embedded (like "200g pasta"), parse it
                return parseIngredientString(parsed.name);
              }
              return {
                name: parsed.name || '',
                amount: parsed.amount || '',
                unit: parsed.unit || ''
              };
            } catch (e) {
              // If parsing fails, try to extract components from the string
              return parseIngredientString(ingredient);
            }
          }
          // If it's a plain string, parse it
          return parseIngredientString(ingredient);
        } else if (typeof ingredient === 'object' && ingredient !== null) {
          // If object has amount/unit embedded in name, extract them
          if (ingredient.name && (ingredient.amount === "" && ingredient.unit === "")) {
            return parseIngredientString(ingredient.name);
          }
          
          // Ensure object has the required properties
          return {
            name: ingredient.name || '',
            amount: ingredient.amount || '',
            unit: ingredient.unit || ''
          };
        }
        // Default fallback
        return {
          name: String(ingredient),
          amount: '',
          unit: ''
        };
      });
    } else if (typeof ingredientsData === 'string') {
      // If it's a string, try to parse it
      try {
        if (ingredientsData.trim().startsWith('[')) {
          // Try to parse as JSON array
          const parsed = JSON.parse(ingredientsData);
          ingredientsData = parsed.map((item: any) => {
            if (typeof item === 'object' && item !== null) {
              return {
                name: item.name || '',
                amount: item.amount || '',
                unit: item.unit || ''
              };
            } else {
              return {
                name: String(item),
                amount: '',
                unit: ''
              };
            }
          });
        } else if (ingredientsData.includes('"name":') && ingredientsData.includes('"amount":')) {
          // Handle a string that contains multiple JSON objects
          const cleanedInput = ingredientsData.replace(/"Ingredients\s+/, '');
          const lines = cleanedInput.split('\n').filter(line => line.trim());
          
          ingredientsData = lines.map(line => {
            try {
              // Try to parse each line as JSON
              if (line.trim().startsWith('{') && line.trim().endsWith('}')) {
                const parsed = JSON.parse(line.trim());
                return {
                  name: parsed.name || '',
                  amount: parsed.amount || '',
                  unit: parsed.unit || ''
                };
              } else {
                return {
                  name: line.trim(),
                  amount: '',
                  unit: ''
                };
              }
            } catch (e) {
              return {
                name: line.trim(),
                amount: '',
                unit: ''
              };
            }
          });
        } else {
          // Simple comma or newline separated list
          const items = ingredientsData.split(/[,\n]/).filter(item => item.trim());
          ingredientsData = items.map(item => ({
            name: item.trim(),
            amount: '',
            unit: ''
          }));
        }
      } catch (e) {
        console.error('Error parsing ingredients string:', e);
        // If parsing fails, create a single ingredient with the entire string
        ingredientsData = [{
          name: ingredientsData,
          amount: '',
          unit: ''
        }];
      }
    } else {
      // If ingredients data is not an array or string, convert to empty array
      ingredientsData = [];
    }

    // Ensure all ingredients are objects
    ingredientsData = Array.isArray(ingredientsData) ? ingredientsData : [];

    console.log('Processed ingredients:', JSON.stringify(ingredientsData).substring(0, 200));
    console.log('Inserting recipe:', recipe.title);

    // Parse calories and protein to extract numeric values
    let calories = 0;
    let protein = 0;

    // Extract numeric values from calorie string if it exists
    if (recipe.calories) {
      const calorieMatch = String(recipe.calories).match(/(\d+)/);
      if (calorieMatch && calorieMatch[1]) {
        calories = parseInt(calorieMatch[1], 10);
      }
    }

    // Extract numeric values from protein string if it exists
    if (recipe.protein) {
      const proteinMatch = String(recipe.protein).match(/(\d+)/);
      if (proteinMatch && proteinMatch[1]) {
        protein = parseInt(proteinMatch[1], 10);
      }
    }

    console.log('Parsed values - Calories:', calories, 'Protein:', protein);

    // Insert recipe
    const { data: savedRecipe, error: saveError } = await serviceRoleSupabase
      .from('recipes')
      .insert({
        user_id: userId,
        title: recipe.title || 'Untitled Recipe',
        ingredients: ingredientsData,
        steps: Array.isArray(recipe.steps) ? recipe.steps : [],
        servings: typeof recipe.servings === 'string' ? parseInt(recipe.servings, 10) || 1 : recipe.servings || 1,
        cooking_time: recipe.cooking_time || '',
        difficulty: recipe.difficulty || 'medium',
        calories: calories,
        protein: protein,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving recipe:', saveError);
      return NextResponse.json({ error: 'Failed to save recipe' }, { status: 500 });
    }

    // Update saved recipes count
    const { error: updateError } = await serviceRoleSupabase
      .from('profiles')
      .update({ 
        saved_recipes_count: (profile.saved_recipes_count || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating saved recipes count:', updateError);
      // If count update fails, delete the saved recipe
      await serviceRoleSupabase
        .from('recipes')
        .delete()
        .eq('id', savedRecipe.id);
      return NextResponse.json({ error: 'Failed to update saved recipes count' }, { status: 500 });
    }

    console.log('Recipe saved successfully:', savedRecipe.id);
    
    return NextResponse.json({ 
      success: true,
      message: 'Recipe saved successfully',
      recipe: savedRecipe
    });
  } catch (error: any) {
    console.error('Error in save recipe:', error);
    return NextResponse.json(
      { error: 'Failed to save recipe: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
} 