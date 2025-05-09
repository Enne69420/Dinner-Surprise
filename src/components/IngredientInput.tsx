'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const IngredientInput = () => {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [currentIngredient, setCurrentIngredient] = useState('');
  const [servings, setServings] = useState(2);
  const [recipe, setRecipe] = useState<any>(null);
  const [usageCount, setUsageCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [savedRecipes, setSavedRecipes] = useState<any[]>([]);
  
  const router = useRouter();
  const { user, subscription } = useAuth();
  const isAuthenticated = !!user;

  useEffect(() => {
    // Load usage count from localStorage for non-authenticated users
    const loadUsageCount = () => {
      if (!isAuthenticated) {
        const count = localStorage.getItem('recipeGenerationCount');
        setUsageCount(count ? parseInt(count, 10) : 0);
      }
    };

    // Load saved recipes count
    const loadSavedRecipes = () => {
      const savedRecipesData = localStorage.getItem('savedRecipes');
      if (savedRecipesData) {
        const recipes = JSON.parse(savedRecipesData);
        setSavedRecipes(recipes);
      }
    };

    loadUsageCount();
    loadSavedRecipes();
  }, [isAuthenticated]);

  const addIngredient = () => {
    if (currentIngredient.trim()) {
      setIngredients([...ingredients, currentIngredient.trim()]);
      setCurrentIngredient('');
    }
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const generateRecipe = async () => {
    if (ingredients.length === 0) {
      alert('Please add at least one ingredient');
      return;
    }

    if (ingredients.length < 3) {
      alert('Please add at least 3 ingredients to generate a recipe');
      return;
    }

    // Check if user is allowed to generate recipe based on subscription
    if (!isAuthenticated && usageCount >= 3) {
      alert('You have used all your free recipe generations. Please sign in for more access.');
      return;
    }

    if (isAuthenticated && subscription.plan === 'free' && subscription.recipesRemaining <= 0) {
      alert('You have used all your free recipe generations this month. Please upgrade to a premium plan for unlimited access.');
      return;
    }

    setIsLoading(true);

    try {
      // Increment usage count for non-authenticated users
      if (!isAuthenticated) {
        const newCount = usageCount + 1;
        setUsageCount(newCount);
        localStorage.setItem('recipeGenerationCount', newCount.toString());
      }

      // Call DeepSeek API
      const response = await fetch('/api/generate-recipe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ingredients,
          servings,
          isAuthenticated,
          userId: user?.id
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        // Handle special error cases
        if (data.errorCode === 'INSUFFICIENT_BALANCE') {
          throw new Error('Recipe generation is temporarily unavailable. Please try again later or contact support.');
        }
        throw new Error(data.error || 'Failed to generate recipe');
      }

      setRecipe(data);
      
    } catch (error: any) {
      console.error('Error generating recipe:', error);
      alert(error.message || 'Error generating recipe. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const saveRecipe = async () => {
    if (!user) {
      alert('Please sign in to save recipes');
      return;
    }

    // Check if user can save more recipes based on their plan
    if (subscription.plan === 'free' && savedRecipes.length >= subscription.savedRecipesLimit) {
      alert(`You've reached your limit of ${subscription.savedRecipesLimit} saved recipes. Please upgrade to save more recipes.`);
      return;
    }
    
    try {
      // Process ingredients to ensure they're in the correct format
      const processedIngredients = recipe.ingredients.map((ingredient: any) => {
        if (typeof ingredient === 'string') {
          // Try to parse if it's a JSON string
          if (ingredient.trim().startsWith('{') && ingredient.trim().endsWith('}')) {
            try {
              return JSON.parse(ingredient);
            } catch (e) {
              return ingredient;
            }
          }
          return ingredient;
        } else if (typeof ingredient === 'object') {
          return ingredient;
        }
        return ingredient;
      });

      const response = await fetch('/api/recipes/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipe: {
            ...recipe,
            ingredients: processedIngredients
          },
          userId: user.id,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save recipe');
      }

      // Update local state
      const updatedSavedRecipes = [...savedRecipes, recipe];
      setSavedRecipes(updatedSavedRecipes);
      alert('Recipe saved successfully!');
      
      // Navigate to recipes page
      router.push('/recipes');
    } catch (error: any) {
      console.error('Error saving recipe:', error);
      alert(error.message || 'Failed to save recipe. Please try again.');
    }
  };

  const reset = () => {
    setRecipe(null);
    setIngredients([]);
  };

  // Calculate remaining free recipe generations
  const getFreeRecipesRemaining = () => {
    if (!isAuthenticated) {
      return 3 - usageCount;
    } else if (subscription.plan === 'free') {
      return subscription.recipesRemaining;
    }
    return 'Unlimited';
  };

  return (
    <div className="max-w-4xl mx-auto">
      {!recipe ? (
        <div className="card">
          <h3 className="text-xl font-semibold text-green-700 mb-4">Enter Your Ingredients</h3>
          
          <div className="flex flex-col md:flex-row gap-2 mb-4">
            <input
              type="text"
              value={currentIngredient}
              onChange={(e) => setCurrentIngredient(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addIngredient()}
              placeholder="Enter an ingredient"
              className="input flex-grow"
            />
            <button 
              onClick={addIngredient}
              className="btn-secondary md:w-auto"
            >
              Add
            </button>
          </div>
          
          {ingredients.length > 0 && (
            <div className="mb-6">
              <h4 className="font-medium mb-2">Your ingredients:</h4>
              <div className="flex flex-wrap gap-2">
                {ingredients.map((ingredient, index) => (
                  <div key={index} className="bg-green-100 px-3 py-1 rounded-full flex items-center">
                    <span>{ingredient}</span>
                    <button 
                      onClick={() => removeIngredient(index)}
                      className="ml-2 text-red-500 hover:text-red-700"
                      aria-label="Remove ingredient"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-gray-600 text-sm mt-2 italic">Note: Water, salt, and pepper are assumed to be available.</p>
              <p className="text-gray-600 text-sm mt-1">You need at least 3 ingredients to generate a recipe.</p>
            </div>
          )}
          
          <div className="mb-6">
            <h4 className="font-medium mb-2">Number of servings:</h4>
            <div className="flex items-center">
              <button 
                onClick={() => setServings(Math.max(1, servings - 1))}
                className="btn-icon"
                aria-label="Decrease servings"
              >
                −
              </button>
              <span className="mx-4 font-medium">{servings}</span>
              <button 
                onClick={() => setServings(servings + 1)}
                className="btn-icon"
                aria-label="Increase servings"
              >
                +
              </button>
            </div>
          </div>
          
          {/* Subscription notice */}
          <div className="mb-4 p-3 bg-blue-50 text-blue-800 rounded-lg">
            {!isAuthenticated ? (
              <p>
                {usageCount >= 3 
                  ? "You've used all your free recipe generations. Sign in for more access!" 
                  : `Free recipe generations remaining: ${3 - usageCount}`
                }
                {' '}
                <Link href="/auth" className="text-blue-600 underline">
                  Sign in
                </Link>
              </p>
            ) : subscription.plan === 'free' ? (
              <p>
                {subscription.recipesRemaining <= 0
                  ? "You've used all your monthly recipe generations. Upgrade for unlimited access!"
                  : `Free recipe generations remaining this month: ${subscription.recipesRemaining}`
                }
                {' '}
                <Link href="/subscribe" className="text-blue-600 underline">
                  Upgrade
                </Link>
              </p>
            ) : (
              <p className="flex items-center">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>
                  {subscription.plan === 'premium' ? 'Premium' : 'Family'} plan: Unlimited recipe generations
                </span>
              </p>
            )}
          </div>
          
          <button 
            onClick={generateRecipe}
            disabled={
              ingredients.length < 3 || 
              isLoading || 
              (!isAuthenticated && usageCount >= 3) ||
              (isAuthenticated && subscription.plan === 'free' && subscription.recipesRemaining <= 0)
            }
            className={`btn-primary w-full ${
              ingredients.length < 3 || 
              (!isAuthenticated && usageCount >= 3) ||
              (isAuthenticated && subscription.plan === 'free' && subscription.recipesRemaining <= 0)
                ? 'opacity-50 cursor-not-allowed' 
                : ''
            }`}
          >
            {isLoading ? 'Generating Recipe...' : 'Find Recipe'}
          </button>
        </div>
      ) : (
        <div className="card">
          <h3 className="text-2xl font-bold text-green-700 mb-1">{recipe.title}</h3>
          <p className="text-gray-600 mb-2">
            {recipe.servings} servings • {recipe.cookingTime} • {recipe.difficulty}
          </p>
          
          <div className="flex items-center text-gray-600 mb-6">
            <span className="inline-flex items-center mr-4">
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
              {recipe.calories || 'N/A'} cal per serving
            </span>
            <span className="inline-flex items-center">
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path>
              </svg>
              {recipe.protein || 'N/A'}g protein per serving
            </span>
          </div>
          
          <div className="mb-6">
            <h4 className="text-xl font-semibold mb-2">Ingredients</h4>
            <ul className="list-disc pl-5 space-y-1">
              {recipe.ingredients.map((ingredient: any, i: number) => (
                <li key={i}>
                  {typeof ingredient === 'string' 
                    ? ingredient 
                    : `${ingredient.amount || ''} ${ingredient.unit || ''} ${ingredient.name || ''}`}
                </li>
              ))}
            </ul>
            <p className="text-gray-600 text-sm mt-2 italic">Note: Water, salt, and pepper are assumed to be available.</p>
          </div>
          
          <div className="mb-6">
            <h4 className="text-xl font-semibold mb-2">Instructions</h4>
            <ol className="list-decimal pl-5 space-y-3">
              {recipe.steps.map((step: string, i: number) => (
                <li key={i} className="pl-1">{step}</li>
              ))}
            </ol>
          </div>
          
          <div className="flex justify-between">
            <button 
              onClick={reset}
              className="btn-secondary"
            >
              New Recipe
            </button>
            
            {!isAuthenticated ? (
              <Link href="/auth" className="btn-primary">
                Sign In To Save
              </Link>
            ) : (
              <button 
                onClick={saveRecipe}
                disabled={subscription.plan === 'free' && savedRecipes.length >= subscription.savedRecipesLimit}
                className={`btn-primary ${
                  subscription.plan === 'free' && savedRecipes.length >= subscription.savedRecipesLimit 
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                }`}
              >
                {subscription.plan === 'free' 
                  ? `Save Recipe (${savedRecipes.length}/${subscription.savedRecipesLimit})` 
                  : 'Save Recipe'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default IngredientInput; 