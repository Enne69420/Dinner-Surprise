import type { Schema } from "../../data/resource";

// This handler is strongly typed based on the Schema defined in data/resource.ts
export const handler: Schema["sayHello"]["functionHandler"] = async (event) => {
  const { name } = event.arguments;
  
  // Access environment variables that were defined in resource.ts
  // These are set in the Amplify Console
  const exampleVar = process.env.EXAMPLE_VARIABLE || 'default';
  
  // You can also access secrets that are stored in AWS Secrets Manager
  // For this, you need to configure permissions in the resource.ts file
  
  return `Hello, ${name}! (Env: ${exampleVar})`;
}; 