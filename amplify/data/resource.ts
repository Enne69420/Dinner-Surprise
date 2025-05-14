import { type ClientSchema, a, defineData } from "@aws-amplify/backend";
import { apiFunction } from "../functions/api-function/resource";

// Define your data schema with type safety
const schema = a.schema({
  Todo: a
    .model({
      content: a.string(),
      isDone: a.boolean().default(false),
      priority: a.enum(["LOW", "MEDIUM", "HIGH"]),
      // UserId will be populated from Supabase auth
      userId: a.string().required(),
    })
    .authorization((allow) => [
      // Guest access for read operations
      allow.guest().to(['read']),
      // API key for all operations
      allow.apiKey(),
    ]),
  
  // Custom API call that links to your function
  apiCall: a
    .query()
    .arguments({
      query: a.string().required(),
      // Add more parameters as needed
    })
    .returns(a.string()) // Return JSON as a string for simplicity
    .authorization(allow => [allow.apiKey()])
    .handler(a.handler.function(apiFunction)),
});

// Export the type-safe client schema
export type Schema = ClientSchema<typeof schema>;

// Define the data resource
export const data = defineData({
  schema,
  authorizationModes: {
    // Default auth mode 
    defaultAuthorizationMode: "apiKey",
    apiKey: {
      expiresInDays: 365,
    },
  },
}); 