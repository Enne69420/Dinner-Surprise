import { defineBackend } from '@aws-amplify/backend';
import { generateRecipeFunction } from './functions/generateRecipe';

// Define backend resources for the Dinner Surprise application
export const backend = defineBackend({
  // Register the function that handles recipe generation
  generateRecipeFunction
}); 