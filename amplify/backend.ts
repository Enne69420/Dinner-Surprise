import { defineBackend } from '@aws-amplify/backend';
import { data } from './data/resource';
import { apiFunction } from './functions/api-function/resource';

// Define backend resources for the Dinner Surprise application
export const backend = defineBackend({
  // Only using Amplify for data and function APIs since Supabase handles auth
  data,
  apiFunction
}); 