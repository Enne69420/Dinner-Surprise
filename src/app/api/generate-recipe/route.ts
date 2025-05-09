import { NextRequest, NextResponse } from 'next/server';
import OpenAI from "openai";
import { createClient } from '@supabase/supabase-js';

// Initialize OpenAI client with DeepSeek's base URL
let openai: OpenAI;
try {
  if (!process.env.DEEPSEEK_API_KEY) {
    console.error('WARNING: DEEPSEEK_API_KEY is not set in environment variables');
  }
  
  openai = new OpenAI({
    baseURL: "https://api.deepseek.com/v1",
    apiKey: process.env.DEEPSEEK_API_KEY || 'dummy_key_for_development',
  });
} catch (error) {
  console.error('Error initializing OpenAI client:', error);
}

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper function to extract JSON from markdown code blocks or text
function extractJsonFromText(text: string): string {
  // Try to extract JSON from markdown code blocks
  const jsonBlockMatch = text.match(/```(?:json)?\s*({[\s\S]*?})\s*```/);
  if (jsonBlockMatch && jsonBlockMatch[1]) {
    return jsonBlockMatch[1].trim();
  }
  
  // If no code block, try to extract anything that looks like a JSON object
  const jsonMatch = text.match(/({[\s\S]*})/);
  if (jsonMatch && jsonMatch[1]) {
    return jsonMatch[1].trim();
  }
  
  // Return the original text if no JSON-like content found
  return text.trim();
}

export async function POST(req: NextRequest) {
  try {
    const { ingredients, servings, userId } = await req.json();

    if (!ingredients || ingredients.length === 0) {
      return NextResponse.json(
        { error: 'Ingredients are required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Check user's monthly usage and tier
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('monthly_usage, tier')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json({ error: `Failed to fetch user profile: ${profileError.message}` }, { status: 500 });
    }
    
    console.log('Profile data:', profile);

    // Check if user has exceeded their monthly limit
    const monthlyLimit = profile.tier === 'premium' ? Infinity : 3;
    if (profile.monthly_usage >= monthlyLimit) {
      return NextResponse.json(
        { error: 'Monthly recipe generation limit reached. Please upgrade to premium for unlimited recipes.' },
        { status: 403 }
      );
    }

    // Increment monthly usage
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        monthly_usage: profile.monthly_usage + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating monthly usage:', updateError);
      return NextResponse.json({ error: `Failed to update usage: ${updateError.message}` }, { status: 500 });
    }

    // For testing, create a mock recipe if DeepSeek API key is not available
    if (!process.env.DEEPSEEK_API_KEY) {
      console.log('Using mock recipe because DEEPSEEK_API_KEY is not set');
      
      // Extract ingredient names for the mock recipe
      const ingredientNames = ingredients.map((ing: any) => {
        if (typeof ing === 'object' && ing.name) {
          return ing.name;
        }
        return ing;
      });
      
      const mockRecipe = {
        title: `${ingredientNames[0]} ${ingredientNames.length > 1 ? `and ${ingredientNames[1]}` : ''} Recipe`,
        ingredients: ingredientNames.map((ing: string) => `100g ${ing}`),
        steps: [
          "1. Prepare and measure all ingredients.",
          `2. Combine ${ingredientNames.join(', ')} in a suitable dish.`,
          "3. Cook according to your preference.",
          "4. Serve and enjoy!"
        ],
        servings: servings,
        cookingTime: "30 minutes",
        difficulty: "Medium",
        calories: 300,
        protein: 15
      };
      return NextResponse.json(mockRecipe);
    }

    // Create the prompt for DeepSeek API
    const prompt = `
      Create a recipe using these ingredients:
      ${ingredients.map((ing: any) => {
        // Handle both object and string ingredients for backward compatibility
        if (typeof ing === 'object') {
          return ing.name + (ing.quantity && ing.unit ? ` (${ing.quantity} ${ing.unit})` : '');
        }
        return ing;
      }).join(', ')}.
      
      Servings: ${servings}
      
      APPROACH:
      1. First, consider common, well-known recipes that use MOST (not necessarily all) of these ingredients.
      2. You do NOT need to use every ingredient listed - use the subset that makes the most coherent recipe.
      3. Only create a completely new recipe if no common, recognizable dishes can be made with these ingredients.
      4. Prioritize recipes that people would typically make with these ingredients in everyday cooking.
      5. Feel free to suggest additional common ingredients that would complete the recipe if needed.
      6. IMPORTANT: Be mindful of the quantities available and don't use more of an ingredient than what is indicated.
      7. When quantities are provided (e.g., "onions (5 pieces)"), make sure your recipe stays within these limits.
      
      Your response must be a valid JSON object with these properties:
      - title: A creative name for the recipe (should be a common dish name if applicable)
      - ingredients: List each with precise metric measurements (ml, g, etc. - NO cups or tablespoons)
      - steps: Detailed step-by-step cooking instructions
      - servings: ${servings}
      - cookingTime: Estimated cooking time
      - difficulty: Easy, Medium, or Hard
      - calories: Approximate calories per serving
      - protein: Approximate protein content per serving in grams
      
      IMPORTANT: Return ONLY the JSON object. Do not include any markdown formatting, backticks, or the word "json".
      The response must be parseable as JSON.
    `;

    try {
      // Call DeepSeek API using the OpenAI library
      const completion = await openai.chat.completions.create({
        model: "deepseek-chat",
        messages: [
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000,
        response_format: { type: "json_object" }
      });

      const content = completion.choices[0].message.content;
      
      if (!content) {
        throw new Error('Empty response from AI service');
      }

      // Clean up the response to handle markdown formatting
      const cleanedContent = extractJsonFromText(content);
      
      try {
        // Try to parse the JSON from the cleaned response
        const recipeData = JSON.parse(cleanedContent);
        
        // Validate the recipe data structure
        if (!recipeData.title || !recipeData.ingredients || !recipeData.steps) {
          throw new Error('Invalid recipe data structure');
        }

        // Ensure calories and protein are numeric values
        if (recipeData.calories && typeof recipeData.calories === 'string') {
          const calorieMatch = recipeData.calories.match(/(\d+)/);
          if (calorieMatch && calorieMatch[1]) {
            recipeData.calories = parseInt(calorieMatch[1], 10);
          } else {
            recipeData.calories = 0;
          }
        }

        if (recipeData.protein && typeof recipeData.protein === 'string') {
          const proteinMatch = recipeData.protein.match(/(\d+)/);
          if (proteinMatch && proteinMatch[1]) {
            recipeData.protein = parseInt(proteinMatch[1], 10);
          } else {
            recipeData.protein = 0;
          }
        }

        // Ensure servings is numeric
        if (recipeData.servings && typeof recipeData.servings === 'string') {
          const servingsMatch = recipeData.servings.match(/(\d+)/);
          if (servingsMatch && servingsMatch[1]) {
            recipeData.servings = parseInt(servingsMatch[1], 10);
          }
        }

        return NextResponse.json(recipeData);
      } catch (jsonError) {
        console.error('JSON parsing error:', jsonError, 'Content:', cleanedContent);
        // Create a simplified recipe as fallback
        const ingredientNames = ingredients.map((ing: any) => {
          if (typeof ing === 'object' && ing.name) {
            return ing.name;
          }
          return ing;
        });
        
        const fallbackRecipe = {
          title: `${ingredientNames[0]} ${ingredientNames.length > 1 ? `and ${ingredientNames[1]}` : ''} Recipe`,
          ingredients: ingredientNames.map((ing: string) => `100g ${ing}`),
          steps: [
            "1. Prepare and measure all ingredients.",
            `2. Combine ${ingredientNames.join(', ')} in a suitable dish.`,
            "3. Cook according to your preference.",
            "4. Serve and enjoy!"
          ],
          servings: servings,
          cookingTime: "30 minutes",
          difficulty: "Medium",
          calories: 300,
          protein: 15
        };
        
        console.log('Using fallback recipe due to JSON parsing error');
        return NextResponse.json(fallbackRecipe);
      }
    } catch (apiError: any) {
      console.error('AI API error:', apiError);
      
      // Roll back the usage increment
      await supabase
        .from('profiles')
        .update({ 
          monthly_usage: profile.monthly_usage - 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      // Check for insufficient balance error
      if (apiError.status === 402 || (apiError.error && apiError.error.message === 'Insufficient Balance')) {
        return NextResponse.json(
          { 
            error: 'The AI service is currently unavailable due to insufficient account balance. The site administrator needs to add credits to the DeepSeek account to continue generating recipes.',
            errorCode: 'INSUFFICIENT_BALANCE'
          },
          { status: 503 } // Service Unavailable
        );
      }
      
      return NextResponse.json(
        { error: apiError.message || 'Failed to generate recipe from AI service' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Recipe generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate recipe' },
      { status: 500 }
    );
  }
} 