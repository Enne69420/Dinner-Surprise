import type { Schema } from "../../data/resource";

// This handler is type-safe based on the Schema defined in data/resource.ts
export const handler: Schema["apiCall"]["functionHandler"] = async (event) => {
  // Access environment variables that were defined in resource.ts
  const apiKey = process.env.API_KEY || '';
  const apiEndpoint = process.env.API_ENDPOINT || '';
  
  // Extract query parameter from the event
  const query = event.arguments.query;
  
  try {
    // Example of making an external API call using environment variables
    const response = await fetch(`${apiEndpoint}?key=${apiKey}&query=${query}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`API call failed with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Return response as a stringified JSON
    return JSON.stringify({
      success: true,
      data: data,
      message: "API call successful"
    });
  } catch (error) {
    console.error('Error in API call:', error);
    
    // Return error as a stringified JSON
    return JSON.stringify({
      success: false,
      data: null,
      message: error instanceof Error ? error.message : "Unknown error occurred"
    });
  }
}; 