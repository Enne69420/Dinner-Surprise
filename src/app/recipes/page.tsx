'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import supabase from '@/utils/supabase';

// Define interface for recipe ingredient
interface RecipeIngredient {
  name: string;
  amount?: string | number;
  unit?: string;
}

// Update the recipe type
interface Recipe {
  id: string;
  title: string;
  ingredients: any[];
  steps: string[];
  servings: number;
  cooking_time: string;
  difficulty: string;
  calories: number;
  protein: number;
  created_at: string;
  updated_at: string;
}

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();
  
  useEffect(() => {
    const fetchRecipes = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      try {
        console.log('Fetching recipes for user:', user.id);
        const { data, error } = await supabase
          .from('recipes')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error('Error fetching recipes:', error);
          setError('Failed to load your recipes. Please try again later.');
          setIsLoading(false);
          return;
        }
        
        console.log('Recipes fetched:', data?.length || 0);
        setRecipes(data || []);
        
        // Select the first recipe by default if available
        if (data && data.length > 0) {
          setSelectedRecipe(data[0]);
        }
        
      } catch (err) {
        console.error('Error in recipe fetch:', err);
        setError('An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRecipes();
  }, [user]);
  
  // Convert ISO string to readable date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Handle recipe deletion
  const deleteRecipe = async (recipeId: string) => {
    if (!confirm('Are you sure you want to delete this recipe?')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', recipeId)
        .eq('user_id', user?.id);
        
      if (error) {
        console.error('Error deleting recipe:', error);
        setError('Failed to delete recipe');
        return;
      }
      
      // Remove recipe from state and select another if available
      const updatedRecipes = recipes.filter(r => r.id !== recipeId);
      setRecipes(updatedRecipes);
      
      if (selectedRecipe?.id === recipeId) {
        setSelectedRecipe(updatedRecipes.length > 0 ? updatedRecipes[0] : null);
      }
      
    } catch (err) {
      console.error('Error in recipe deletion:', err);
      setError('An unexpected error occurred');
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto mb-4"></div>
          <div className="h-2 bg-gray-200 rounded w-1/3 mx-auto mb-12"></div>
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
          </div>
          <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto mt-4"></div>
          <div className="h-2 bg-gray-200 rounded w-1/2 mx-auto mt-2"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-[#265c40]">Your Recipes</h1>
        <p className="text-gray-600 mt-2">
          View and reuse recipes you've previously generated
        </p>
        
        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-800 rounded-lg max-w-xl mx-auto">
            <p>{error}</p>
          </div>
        )}
      </div>

      {/* Empty state */}
      {recipes.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[#265c40]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No recipes found</h2>
          <p className="text-gray-500 mb-6">You haven't generated any recipes yet</p>
          <Link href="/grocery-list" className="btn-primary">
            Create Your First Recipe
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-8">
          {/* Recipe List */}
          <div className="md:col-span-1 space-y-4">
            {recipes.map((recipe) => (
              <div 
                key={recipe.id}
                className={`card cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  selectedRecipe?.id === recipe.id ? 'border-[#265c40] border-l-4' : ''
                }`}
                onClick={() => setSelectedRecipe(recipe)}
              >
                <h3 className="text-lg font-semibold text-[#265c40]">{recipe.title}</h3>
                <p className="text-gray-500 text-sm mb-2">
                  Created on {formatDate(recipe.created_at)}
                </p>
                <div className="flex items-center text-sm text-gray-600 mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {recipe.cooking_time}
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Serves {recipe.servings}
                </div>
                <div className="flex flex-wrap gap-1">
                  {recipe.ingredients.slice(0, 3).map((ingredient: string | RecipeIngredient, i) => (
                    <span 
                      key={i} 
                      className="bg-green-50 text-[#265c40] text-xs px-2 py-1 rounded"
                    >
                      {typeof ingredient === 'string' 
                        ? ingredient 
                        : (ingredient.name || '')}
                    </span>
                  ))}
                  {recipe.ingredients.length > 3 && (
                    <span className="bg-gray-50 text-gray-500 text-xs px-2 py-1 rounded">
                      +{recipe.ingredients.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Recipe Detail */}
          <div className="md:col-span-2">
            {selectedRecipe ? (
              <div className="card">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold text-[#265c40]">{selectedRecipe.title}</h2>
                  <button 
                    onClick={() => deleteRecipe(selectedRecipe.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                
                <div className="flex flex-wrap gap-4 mb-6">
                  <div className="flex items-center text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-[#265c40]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{selectedRecipe.cooking_time}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-[#265c40]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>Serves {selectedRecipe.servings}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-[#265c40]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Created on {formatDate(selectedRecipe.created_at)}</span>
                  </div>
                </div>
                
                {/* Nutrition Information */}
                {(selectedRecipe.calories || selectedRecipe.protein) && (
                  <div className="bg-green-50 p-4 rounded-lg mb-6">
                    <h3 className="text-lg font-semibold text-[#265c40] mb-2">Nutrition Facts</h3>
                    <div className="flex flex-wrap gap-4">
                      {selectedRecipe.calories && (
                        <div className="flex items-center">
                          <svg className="w-5 h-5 mr-2 text-[#265c40]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <span className="text-gray-700">
                            <span className="font-semibold">{selectedRecipe.calories}</span> calories per serving
                          </span>
                        </div>
                      )}
                      {selectedRecipe.protein && (
                        <div className="flex items-center">
                          <svg className="w-5 h-5 mr-2 text-[#265c40]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                          </svg>
                          <span className="text-gray-700">
                            <span className="font-semibold">{selectedRecipe.protein}g</span> protein per serving
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-[#265c40] mb-2">Ingredients</h3>
                  <ul className="space-y-1">
                    {selectedRecipe.ingredients.map((ingredient: string | RecipeIngredient, i) => (
                      <li key={i} className="flex items-start">
                        <svg className="h-5 w-5 text-[#265c40] mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        <span>
                          {typeof ingredient === 'string' 
                            ? ingredient 
                            : `${ingredient.amount || ''} ${ingredient.unit || ''} ${ingredient.name || ''}`}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-[#265c40] mb-2">Instructions</h3>
                  <ol className="list-decimal pl-5 space-y-2">
                    {selectedRecipe.steps.map((step, i) => (
                      <li key={i} className="pl-1">{step}</li>
                    ))}
                  </ol>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/grocery-list" className="btn-primary flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    Cook Again
                  </Link>
                  <button 
                    onClick={() => window.print()}
                    className="btn-secondary flex items-center justify-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Print Recipe
                  </button>
                </div>
              </div>
            ) : (
              <div className="card bg-gray-50 flex items-center justify-center h-full min-h-[400px]">
                <div className="text-center">
                  <div className="flex justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-500">Select a recipe to view details</h3>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 