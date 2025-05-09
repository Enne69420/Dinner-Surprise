'use client';

import { useState, useEffect, useRef } from 'react';
import { addDays, isBefore, isAfter, format } from 'date-fns';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Interface for grocery item
interface GroceryItem {
  id: string;
  name: string;
  expiryDate?: Date; // Made optional
  quantity?: number; // Made optional
  unit?: string;     // Made optional
  category: string;  // Will be auto-generated
}

// Interface for recipe
interface Recipe {
  title: string;
  ingredients: any[]; // Changed from string[] to any[] to support both strings and objects
  steps: string[];
  servings: number;
  cookingTime: string;
  difficulty: string;
  calories: number;
  protein: number;
}

// Mock data for grocery list
const mockGroceryItems: GroceryItem[] = [];

// Units for dropdown
const units = [
  'pieces', 'lb', 'oz', 'gallon', 'quart', 'cup', 'tbsp', 'tsp', 'g', 'kg', 'ml', 'l', 'bag', 'box', 'can', 'bottle', 'package'
];

// Function to determine category from item name
const determineCategoryFromName = (name: string): string => {
  name = name.toLowerCase();
  
  // Define category mappings
  const categoryMappings: {[key: string]: string[]} = {
    'Produce': ['apple', 'banana', 'orange', 'lettuce', 'spinach', 'tomato', 'carrot', 'onion', 'garlic', 'potato', 'vegetable', 'fruit', 'avocado', 'herb', 'kale', 'pepper', 'cucumber'],
    'Meat': ['beef', 'chicken', 'pork', 'steak', 'sausage', 'bacon', 'ham', 'turkey', 'meat', 'fish', 'salmon', 'tuna', 'shrimp', 'lamb'],
    'Dairy': ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'egg', 'dairy', 'sour cream', 'ice cream', 'whipped cream'],
    'Bakery': ['bread', 'bagel', 'cake', 'cookie', 'pastry', 'muffin', 'donut', 'bun', 'croissant', 'roll', 'bakery'],
    'Grains': ['rice', 'pasta', 'noodle', 'cereal', 'oat', 'grain', 'quinoa', 'couscous', 'flour', 'barley'],
    'Canned Goods': ['can', 'soup', 'bean', 'tuna', 'corn', 'tomato sauce', 'canned'],
    'Frozen Foods': ['frozen', 'ice cream', 'pizza', 'popsicle', 'frozen dinner'],
    'Snacks': ['chip', 'cracker', 'pretzel', 'popcorn', 'nut', 'candy', 'chocolate', 'snack'],
    'Beverages': ['water', 'soda', 'juice', 'tea', 'coffee', 'beer', 'wine', 'milk', 'drink', 'beverage'],
    'Condiments': ['ketchup', 'mustard', 'mayonnaise', 'sauce', 'dressing', 'oil', 'vinegar', 'spice', 'seasoning', 'salt', 'pepper', 'herb'],
    'Baking': ['sugar', 'flour', 'baking soda', 'baking powder', 'vanilla', 'chocolate chip', 'cake mix']
  };
  
  // Check if the name contains any keywords
  for (const [category, keywords] of Object.entries(categoryMappings)) {
    if (keywords.some(keyword => name.includes(keyword))) {
      return category;
    }
  }
  
  // Default category
  return 'Other';
};

export default function GroceryListPage() {
  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>(mockGroceryItems);
  const router = useRouter();
  const [newItem, setNewItem] = useState('');
  const [newQuantity, setNewQuantity] = useState<number | undefined>(undefined);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [newUnit, setNewUnit] = useState<string | undefined>(undefined);
  const [newExpiryDate, setNewExpiryDate] = useState<Date | undefined>(undefined);
  const [sortBy, setSortBy] = useState<'expiry' | 'category' | 'name'>('category');
  const [error, setError] = useState<string | null>(null);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [recipeServings, setRecipeServings] = useState(2);
  const [isLoadingRecipe, setIsLoadingRecipe] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  
  const { user, subscription, loading } = useAuth();
  const isAuthenticated = !!user;
  const isPremium = isAuthenticated && (subscription.plan === 'premium' || subscription.plan === 'family');

  // Use a ref to track the previous grocery items state
  const prevGroceryItemsRef = useRef<GroceryItem[]>([]);
  
  // Use a timeout ref for debouncing
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Load grocery list for all authenticated users (both free and premium)
    const loadGroceryList = async () => {
      if (isAuthenticated && user?.id) {
        try {
          const response = await fetch(`/api/grocery-list?userId=${user.id}`);
          if (response.ok) {
            const data = await response.json();
            if (data.items && Array.isArray(data.items)) {
              // Process dates from the API response
              const processedItems = data.items.map((item: any) => ({
                ...item,
                expiryDate: item.expiryDate ? new Date(item.expiryDate) : undefined
              }));
              setGroceryItems(processedItems);
            }
          } else {
            console.warn('Failed to load grocery list from API, using localStorage');
            loadFromLocalStorage();
          }
        } catch (error) {
          console.error('Error loading grocery list from API:', error);
          // Fallback to localStorage on error
          loadFromLocalStorage();
        }
      } else {
        // Not authenticated or loading, use localStorage
        console.log('User not authenticated, using localStorage for grocery list');
        loadFromLocalStorage();
      }
    };

    // Helper function to load from localStorage
    const loadFromLocalStorage = () => {
      try {
        const savedGroceryItems = localStorage.getItem('groceryItems');
        if (savedGroceryItems) {
          const parsedItems = JSON.parse(savedGroceryItems, (key, value) => {
            if (key === 'expiryDate' && value) {
              return new Date(value);
            }
            return value;
          });
          setGroceryItems(parsedItems);
        }
      } catch (error) {
        console.error('Error parsing localStorage data:', error);
        // Error parsing localStorage data, start with empty list
        setGroceryItems([]);
      }
    };

    // Only try to load once both auth state and loading state are settled
    loadGroceryList();
  }, [isAuthenticated, user?.id, loading]);

  // Save grocery list when it changes, with debouncing
  useEffect(() => {
    // Skip on initial render
    if (prevGroceryItemsRef.current.length === 0 && groceryItems.length === 0) {
      prevGroceryItemsRef.current = groceryItems;
      return;
    }
    
    // Check if the items have actually changed
    const hasChanged = JSON.stringify(prevGroceryItemsRef.current) !== JSON.stringify(groceryItems);
    
    // Update the previous state ref
    prevGroceryItemsRef.current = groceryItems;
    
    // If nothing changed, skip saving
    if (!hasChanged) {
      return;
    }
    
    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Set a new timeout for debounced saving
    saveTimeoutRef.current = setTimeout(() => {
      const saveGroceryList = async () => {
        // Always save to localStorage
        localStorage.setItem('groceryItems', JSON.stringify(groceryItems));
        
        // If authenticated (free or premium), save to the server as well
        if (isAuthenticated && user?.id) {
          try {
            await fetch('/api/grocery-list', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                items: groceryItems,
                userId: user.id,
              }),
            });
          } catch (error) {
            // Silently handle error, local storage is our backup
          }
        }
      };
      
      saveGroceryList();
    }, 1000); // 1 second debounce delay
    
    // Cleanup function
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [groceryItems, isAuthenticated, user?.id]);

  // Check if an item is expiring soon (within 3 days)
  const isExpiringSoon = (expiryDate?: Date) => {
    if (!expiryDate) return false;
    const threeDaysFromNow = addDays(new Date(), 3);
    return isBefore(expiryDate, threeDaysFromNow) && isAfter(expiryDate, new Date());
  };

  // Check if an item is expired
  const isExpired = (expiryDate?: Date) => {
    if (!expiryDate) return false;
    return isBefore(expiryDate, new Date());
  };

  // Add a new item to the grocery list
  const addItem = () => {
    if (newItem.trim() === '') {
      setError('Please enter an item name');
      return;
    }

    setError(null);
    const newGroceryItem: GroceryItem = {
      id: Date.now().toString(),
      name: newItem.trim(),
      category: determineCategoryFromName(newItem.trim()),
    };
    
    // Only add optional fields if they have values
    if (newExpiryDate) newGroceryItem.expiryDate = newExpiryDate;
    if (newQuantity) newGroceryItem.quantity = newQuantity;
    if (newUnit) newGroceryItem.unit = newUnit;

    setGroceryItems([...groceryItems, newGroceryItem]);
    setNewItem('');
    setNewQuantity(undefined);
    setNewUnit(undefined);
    setNewExpiryDate(undefined);
    setShowAdvancedOptions(false);
  };

  // Remove an item from the grocery list
  const removeItem = (id: string) => {
    setGroceryItems(groceryItems.filter(item => item.id !== id));
    setSelectedItems(selectedItems.filter(itemId => itemId !== id));
  };

  // Generate a recipe from selected grocery items
  const generateRecipe = async () => {
    if (selectedItems.length === 0) {
      setError('Please select at least one ingredient');
      return;
    }

    if (selectedItems.length < 3) {
      setError('Please select at least 3 ingredients to generate a recipe');
      return;
    }

    // Check if user is allowed to generate recipe based on subscription
    if (!isAuthenticated) {
      setError('Sign in to generate recipes. Free users get 3 recipes per month.');
      return;
    }

    if (isAuthenticated && subscription.plan === 'free' && 
        typeof subscription.recipesRemaining === 'number' && 
        subscription.recipesRemaining <= 0) {
      setError('You have used all your free recipe generations this month. Please upgrade to a premium plan for unlimited access.');
      return;
    }

    setError(null);
    setIsLoadingRecipe(true);

    try {
      // Get complete items with all details
      const selectedItemsDetails = groceryItems
        .filter(item => selectedItems.includes(item.id))
        .map(item => ({
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          expiryDate: item.expiryDate ? item.expiryDate.toISOString() : undefined
        }));

      // Ensure we have the userId
      if (!user || !user.id) {
        throw new Error('User not authenticated. Please sign in again.');
      }

      // Call the API
      const response = await fetch('/api/generate-recipe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ingredients: selectedItemsDetails,
          servings: recipeServings,
          userId: user.id
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
      setError(error.message || 'Failed to generate recipe. Please try again.');
    } finally {
      setIsLoadingRecipe(false);
    }
  };

  // Reset recipe
  const resetRecipe = () => {
    setRecipe(null);
    setSelectedItems([]);
  };

  // Handle item selection for recipe
  const toggleItemSelection = (id: string) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(itemId => itemId !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  // Sort grocery items based on selected sort option
  const sortedGroceryItems = [...groceryItems].sort((a, b) => {
    if (sortBy === 'expiry') {
      // Handle optional expiry dates
      if (!a.expiryDate && !b.expiryDate) return 0;
      if (!a.expiryDate) return 1; // Items without expiry dates go last
      if (!b.expiryDate) return -1;
      return a.expiryDate.getTime() - b.expiryDate.getTime();
    } else if (sortBy === 'category') {
      return a.category.localeCompare(b.category);
    } else {
      return a.name.localeCompare(b.name);
    }
  });

  // Get row class based on expiry status
  const getRowClass = (expiryDate?: Date) => {
    if (isExpired(expiryDate)) return 'bg-red-50';
    if (isExpiringSoon(expiryDate)) return 'bg-yellow-50';
    return '';
  };

  // Get text class based on expiry status
  const getExpiryClass = (expiryDate?: Date) => {
    if (isExpired(expiryDate)) return 'text-red-600 font-bold';
    if (isExpiringSoon(expiryDate)) return 'text-orange-500 font-bold';
    return 'text-(rgb(var(--green-600)))';
  };

  // Count items by expiry status
  const expiredCount = groceryItems.filter(item => isExpired(item.expiryDate)).length;
  const expiringSoonCount = groceryItems.filter(item => isExpiringSoon(item.expiryDate)).length;
  const goodCount = groceryItems.filter(item => !isExpired(item.expiryDate) && !isExpiringSoon(item.expiryDate)).length;

  // Add a new function to save the recipe
  const saveRecipe = async () => {
    if (!recipe || !isAuthenticated || !user?.id) {
      setError('You must be logged in to save recipes');
      return;
    }
    
    try {
      // Use the limit from subscription
      if (subscription.plan === 'free' && subscription.savedRecipesLimit <= 0) {
        alert('You have reached the maximum number of saved recipes for a free account. Please upgrade to save more recipes.');
        return;
      }
      
      // Helper function to parse ingredient strings
      const parseIngredient = (ingredient: string) => {
        // Common patterns like "200g pasta" or "2 cloves garlic"
        const matches = ingredient.match(/^([\d\/\.\s]+)?\s*([a-zA-Z]+|cloves|slices|pieces)?\s*(.+)$/);
        if (matches) {
          const [_, amount, unit, name] = matches;
          return {
            name: name.trim(),
            amount: amount ? amount.trim() : '',
            unit: unit ? unit.trim() : ''
          };
        }
        
        return { name: ingredient, amount: '', unit: '' };
      };
      
      // Process ingredients to ensure they're in the correct format
      const processedIngredients = recipe.ingredients.map((ingredient: any) => {
        if (typeof ingredient === 'string') {
          // Try to parse if it's a JSON string
          if (ingredient.trim().startsWith('{') && ingredient.trim().endsWith('}')) {
            try {
              const parsed = JSON.parse(ingredient);
              // If the name contains amount and unit info, parse it
              if (parsed.name && parsed.amount === '' && parsed.unit === '') {
                return parseIngredient(parsed.name);
              }
              return parsed;
            } catch (e) {
              // If parsing fails, try to extract components
              return parseIngredient(ingredient);
            }
          }
          // Direct string parsing
          return parseIngredient(ingredient);
        } else if (typeof ingredient === 'object' && ingredient !== null) {
          // If object has name but no amount/unit, try to parse the name
          if (ingredient.name && ingredient.amount === '' && ingredient.unit === '') {
            return parseIngredient(ingredient.name);
          }
          return ingredient;
        }
        
        // Fallback
        return {
          name: String(ingredient),
          amount: '',
          unit: ''
        };
      });
      
      const response = await fetch('/api/recipes/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipe: {
            title: recipe.title,
            ingredients: processedIngredients,
            steps: recipe.steps,
            servings: recipe.servings,
            cooking_time: recipe.cookingTime,
            difficulty: recipe.difficulty,
            calories: recipe.calories,
            protein: recipe.protein
          },
          userId: user.id
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save recipe');
      }
      
      // Show success message and navigate to recipes page
      alert('Recipe saved successfully!');
      router.push('/recipes');
      
    } catch (error: any) {
      console.error('Save recipe error:', error);
      alert(`Failed to save recipe: ${error.message}`);
    }
  };

  // If redirecting, show a loading message
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 border-4 border-(rgb(var(--green-600))) border-t-transparent rounded-full animate-spin mb-6"></div>
        <h2 className="text-xl font-medium text-(rgb(var(--green-600)))">Loading grocery list...</h2>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-(rgb(var(--green-700)))">Your Grocery List</h1>
        <p className="text-gray-600 mt-2">
          Keep track of your groceries and their expiry dates
        </p>
        
        {/* Subscription notice only for non-authenticated users */}
        {!isAuthenticated && (
          <div className="mt-4 p-3 bg-blue-50 text-blue-800 rounded-lg max-w-xl mx-auto">
            <p className="flex items-center justify-center">
              <svg className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                Sign in to save your grocery list and generate recipes.
                {' '}
                <Link href="/auth" className="text-blue-600 underline font-semibold">
                  Sign in
                </Link>
              </span>
            </p>
          </div>
        )}
      </div>

      {!recipe ? (
        <div className="md:flex gap-8">
          {/* Left sidebar */}
          <div className="md:w-1/3 mb-8 md:mb-0">
            <div className="card space-y-4">
              <h2 className="text-xl font-semibold text-(rgb(var(--green-700))) mb-2">Add New Item</h2>
              
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4">
                  <p className="text-red-700">{error}</p>
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="item" className="block text-sm font-medium text-gray-700 mb-1">
                    Ingredient Name
                  </label>
                  <input
                    id="item"
                    type="text"
                    className="form-input w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-[#265c40] focus:border-[#265c40]"
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    placeholder="Enter ingredient name"
                  />
                </div>
              </div>
              
              {showAdvancedOptions && (
                <div className="space-y-4 mt-4 p-4 bg-gray-50 rounded-md border border-gray-100">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                        Quantity
                      </label>
                      <input
                        id="quantity"
                        type="number"
                        min="1"
                        className="form-input w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-[#265c40] focus:border-[#265c40]"
                        value={newQuantity !== undefined ? newQuantity : ''}
                        onChange={(e) => setNewQuantity(e.target.value ? parseInt(e.target.value) : undefined)}
                        placeholder="Optional"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-1">
                        Unit
                      </label>
                      <select
                        id="unit"
                        className="form-input w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-[#265c40] focus:border-[#265c40]"
                        value={newUnit || ''}
                        onChange={(e) => setNewUnit(e.target.value || undefined)}
                      >
                        <option value="">Select unit</option>
                        {units.map((unit) => (
                          <option key={unit} value={unit}>{unit}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-1">
                      Expiry Date (Optional)
                    </label>
                    <DatePicker
                      id="expiryDate"
                      selected={newExpiryDate}
                      onChange={(date: Date | null) => setNewExpiryDate(date || undefined)}
                      className="form-input w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-[#265c40] focus:border-[#265c40]"
                      placeholderText="Select expiry date (optional)"
                      dateFormat="MMMM d, yyyy"
                      isClearable
                    />
                  </div>
                </div>
              )}
              
              <div className="flex justify-between mt-6">
                <button 
                  className="text-sm text-[#265c40] hover:text-[#153824] flex items-center"
                  onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                >
                  <span>{showAdvancedOptions ? 'Hide options' : 'Show more options'}</span>
                  <svg 
                    className={`ml-1 h-4 w-4 transition-transform duration-200 ${showAdvancedOptions ? 'rotate-180' : ''}`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                <button 
                  className="btn-primary px-6 py-2"
                  onClick={addItem}
                >
                  Add Item
                </button>
              </div>
            </div>

            {/* Expiry Summary */}
            <div className="card mt-6">
              <h2 className="text-xl font-semibold text-(rgb(var(--green-700))) mb-4">Expiry Summary</h2>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-red-600 font-medium flex items-center">
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Expired
                  </span>
                  <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded">
                    {expiredCount} items
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-orange-500 font-medium flex items-center">
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Expiring Soon
                  </span>
                  <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded">
                    {expiringSoonCount} items
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-(rgb(var(--green-600))) font-medium flex items-center">
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Good
                  </span>
                  <span className="bg-(rgb(var(--green-100))) text-(rgb(var(--green-600))) text-xs font-medium px-2.5 py-0.5 rounded">
                    {goodCount} items
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Main content area - Grocery list and Recipe Generator */}
          <div className="md:w-2/3">
            {/* Grocery List */}
            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-(rgb(var(--green-600)))">
                  Your Items ({groceryItems.length})
                </h2>
                
                <div className="flex items-center">
                  <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 mr-2">
                    Sort by:
                  </label>
                  <select
                    id="sortBy"
                    className="form-input py-1 px-2"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'expiry' | 'category' | 'name')}
                  >
                    <option value="category">Category</option>
                    <option value="name">Name</option>
                    <option value="expiry">Expiry Date</option>
                  </select>
                </div>
              </div>
              
              {groceryItems.length === 0 ? (
                <div className="text-center py-8">
                  <div className="mx-auto w-16 h-16 bg-(rgb(var(--green-50))) rounded-full flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-(rgb(var(--green-500)))" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-700 mb-2">Your grocery list is empty</h3>
                  <p className="text-gray-500">Add items to keep track of your groceries</p>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto pr-2">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th scope="col" className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                          Select
                        </th>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Item
                        </th>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell w-1/5">
                          Quantity
                        </th>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell w-1/5">
                          Expiry Date
                        </th>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sortedGroceryItems.map((item) => (
                        <tr key={item.id} className={`${getRowClass(item.expiryDate)} hover:bg-gray-50`}>
                          <td className="px-1 py-3 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedItems.includes(item.id)}
                              onChange={() => toggleItemSelection(item.id)}
                              className="h-4 w-4 text-[#265c40] border-gray-300 rounded focus:ring-[#378c59]"
                            />
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{item.name}</div>
                            {/* Mobile view for quantity and expiry date */}
                            <div className="md:hidden mt-1 space-y-1">
                              {item.quantity && item.unit && (
                                <div className="text-gray-600 text-sm">{item.quantity} {item.unit}</div>
                              )}
                              {item.expiryDate && (
                                <div className={`text-sm ${getExpiryClass(item.expiryDate)}`}>
                                  Exp: {format(item.expiryDate, 'MMM dd, yyyy')}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap hidden md:table-cell">
                            {item.quantity && item.unit 
                              ? <div className="text-gray-600">{item.quantity} {item.unit}</div>
                              : <div className="text-gray-400 italic">Not specified</div>
                            }
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap hidden md:table-cell">
                            {item.expiryDate ? (
                              <div className={getExpiryClass(item.expiryDate)}>
                                {format(item.expiryDate, 'MMM dd, yyyy')}
                                {isExpired(item.expiryDate) && ' (Expired)'}
                                {isExpiringSoon(item.expiryDate) && !isExpired(item.expiryDate) && ' (Soon)'}
                              </div>
                            ) : (
                              <div className="text-gray-400 italic">No date</div>
                            )}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <button
                              className="text-red-500 hover:text-red-700"
                              onClick={() => removeItem(item.id)}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Recipe Generator */}
            <div className="card mt-6 bg-[#f0f8f3] border-[#c6e2d2] border-2">
              <h2 className="text-2xl font-semibold text-[#265c40] mb-4 flex items-center">
                <svg className="h-6 w-6 mr-2 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generate Recipe
              </h2>
              
              <p className="text-[#265c40] mb-4">
                Select ingredients from your list above and create a delicious recipe!
              </p>
              
              <div className="flex items-center gap-4 mb-4">
                <label className="font-medium">Servings:</label>
                <div className="flex items-center">
                  <button 
                    onClick={() => setRecipeServings(Math.max(1, recipeServings - 1))}
                    className="p-2 bg-[#c6e2d2] text-[#265c40] rounded-l-md hover:bg-[#d9f0e5]"
                  >
                    -
                  </button>
                  <span className="px-4 py-2 bg-white text-gray-700 font-medium border-y border-[#c6e2d2]">
                    {recipeServings}
                  </span>
                  <button 
                    onClick={() => setRecipeServings(recipeServings + 1)}
                    className="p-2 bg-[#c6e2d2] text-[#265c40] rounded-r-md hover:bg-[#d9f0e5]"
                  >
                    +
                  </button>
                </div>
              </div>
              
              <div className="bg-white p-3 rounded-lg mb-4 border border-[#c6e2d2]">
                <p className="font-medium mb-2">Selected ingredients: {selectedItems.length}</p>
                <div className="flex flex-wrap gap-2">
                  {selectedItems.length > 0 ? (
                    groceryItems
                      .filter(item => selectedItems.includes(item.id))
                      .map(item => (
                        <div key={item.id} className="bg-[#d9f0e5] px-3 py-1 rounded-full flex items-center">
                          <span>{item.name}</span>
                          <button 
                            onClick={() => toggleItemSelection(item.id)}
                            className="ml-2 text-[#265c40] hover:text-[#378c59]"
                            aria-label="Remove ingredient"
                          >
                            ×
                          </button>
                        </div>
                      ))
                  ) : (
                    <p className="text-gray-500 italic">No ingredients selected yet</p>
                  )}
                </div>
                <p className="text-gray-600 text-sm mt-2 italic">Note: Water, salt, and pepper are assumed to be available.</p>
                <p className="text-gray-600 text-sm mt-1">You need at least 3 ingredients to generate a recipe.</p>
              </div>
              
              <button
                className={`btn-primary w-full ${selectedItems.length < 3 ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'} ${isLoadingRecipe ? 'loading-shimmer' : ''}`}
                onClick={generateRecipe}
                disabled={isLoadingRecipe || selectedItems.length < 3}
              >
                {isLoadingRecipe ? 'Creating Your Recipe...' : 'Find Recipe'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          <div className="card">
            <h3 className="text-2xl font-bold text-[#265c40] mb-1">{recipe.title}</h3>
            <p className="text-gray-600 mb-2">
              {recipe.servings} servings • {recipe.cookingTime} • {recipe.difficulty}
            </p>
            
            <div className="flex items-center text-gray-600 mb-6">
              <span className="inline-flex items-center mr-4">
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
                {recipe.calories} cal per serving
              </span>
              <span className="inline-flex items-center">
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path>
                </svg>
                {recipe.protein}g protein per serving
              </span>
            </div>
            
            <div className="mb-6">
              <h4 className="text-xl font-semibold mb-2">Ingredients</h4>
              <ul className="list-disc pl-5 space-y-1">
                {recipe.ingredients.map((ingredient, i) => {
                  // Handle different ingredient formats
                  if (typeof ingredient === 'string') {
                    // Try to parse JSON if it looks like JSON
                    if (ingredient.trim().startsWith('{') && ingredient.trim().endsWith('}')) {
                      try {
                        const parsed = JSON.parse(ingredient);
                        return (
                          <li key={i}>
                            {parsed.amount || ''} {parsed.unit || ''} {parsed.name || ''}
                          </li>
                        );
                      } catch (e) {
                        // If parsing fails, just display the string
                        return <li key={i}>{ingredient}</li>;
                      }
                    }
                    return <li key={i}>{ingredient}</li>;
                  } else if (typeof ingredient === 'object' && ingredient !== null) {
                    // Handle object format
                    return (
                      <li key={i}>
                        {ingredient.amount || ''} {ingredient.unit || ''} {ingredient.name || ''}
                      </li>
                    );
                  }
                  // Fallback for any other format
                  return <li key={i}>{String(ingredient)}</li>;
                })}
              </ul>
              <p className="text-gray-600 text-sm mt-2 italic">Note: Water, salt, and pepper are assumed to be available.</p>
            </div>
            
            <div className="mb-6">
              <h4 className="text-xl font-semibold mb-2">Instructions</h4>
              <ol className="list-decimal pl-5 space-y-3">
                {recipe.steps.map((step, i) => (
                  <li key={i} className="pl-1">{step}</li>
                ))}
              </ol>
            </div>
            
            <div className="flex justify-between">
              <button 
                onClick={resetRecipe}
                className="btn-secondary"
              >
                Back to Grocery List
              </button>
              
              <button 
                onClick={saveRecipe}
                className="btn-primary"
              >
                Save Recipe
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 