/**
 * Utility functions for handling environment variables with Amplify Gen 2 support
 */

// Node.js process type
declare const process: {
  env: {
    [key: string]: string | undefined;
    NODE_ENV: 'development' | 'production' | 'test';
  };
};

/**
 * Gets an environment variable with fallbacks.
 * For server-side use only.
 * 
 * @param key - The environment variable name to retrieve
 * @param defaultValue - Optional default value if not found
 * @returns The environment variable value or default value
 */
export function getEnv(key: string, defaultValue: string = ''): string {
  try {
    // First try direct process.env access - this will work with Amplify Gen 2 secrets
    if (process.env[key]) {
      return process.env[key] || defaultValue;
    }

    // Return default value if not found
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`Environment variable ${key} not found, using default value`);
    }
    return defaultValue;
  } catch (error) {
    console.error(`Error retrieving environment variable ${key}:`, error);
    return defaultValue;
  }
}

/**
 * Gets a required environment variable. Throws an error if not found.
 * For server-side use only.
 * 
 * @param key - The environment variable name to retrieve
 * @returns The environment variable value
 * @throws Error if the variable is not found
 */
export function getRequiredEnv(key: string): string {
  const value = getEnv(key);
  if (!value) {
    throw new Error(`Required environment variable ${key} not found. Make sure it's configured in Amplify Console's Secret Management.`);
  }
  return value;
}

/**
 * Checks if we're in a development environment
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Checks if we're in a production environment
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Helper function to check if required environment variables are available
 * Useful for debugging during application startup
 * 
 * @param keys - List of environment variable keys to check
 * @returns Object containing status of each key
 */
export function checkRequiredEnvs(keys: string[]): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  
  for (const key of keys) {
    const value = getEnv(key);
    result[key] = !!value;
  }
  
  return result;
} 