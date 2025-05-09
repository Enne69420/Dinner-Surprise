#!/bin/bash
# Script to set up Amplify Gen 2 and fix TypeScript errors

echo "Setting up Amplify Gen 2 for Dinner Surprise..."

# Install Amplify CLI globally
echo "Installing Amplify CLI globally..."
npm install -g @aws-amplify/cli@latest

# Install required dependencies
echo "Installing required dependencies..."
npm install --save @aws-amplify/backend @aws-amplify/backend-cli @aws-amplify/backend-functions
npm install --save-dev @types/aws-amplify

# Initialize Amplify if needed
if [ ! -d "./amplify" ]; then
  echo "Initializing Amplify..."
  amplify init
else
  echo "Amplify already initialized."
fi

# Create type declaration file for Amplify imports
echo "Creating type declarations file for Amplify..."
mkdir -p ./types
cat > ./types/amplify.d.ts << EOL
declare module '@aws-amplify/backend' {
  export function defineBackend(config: any): any;
  export function defineFunction(config: any): any;
  export function secret(name: string): any;
}

declare module '@aws-amplify/backend-functions/function/*/env' {
  export const env: {
    [key: string]: string;
  };
}

declare module '@aws-amplify/backend-runtime' {
  export const env: {
    [key: string]: string;
  };
}
EOL

# Update tsconfig to include custom types
echo "Updating tsconfig.json to include custom types..."
if [ -f "tsconfig.json" ]; then
  # Check if types path already exists in tsconfig
  if grep -q '"types": \[' tsconfig.json; then
    # Add our type to existing types array if not already there
    if ! grep -q '"./types"' tsconfig.json; then
      sed -i 's/"types": \[/"types": \["\.\/types",/g' tsconfig.json
    fi
  else
    # Add types array if it doesn't exist
    sed -i '/"compilerOptions": {/a \    "types": \["./types"\],' tsconfig.json
  fi
else
  echo "tsconfig.json not found. Please add the types directory manually."
fi

echo "Setup complete! You may need to restart your TypeScript server for changes to take effect."
echo "Use 'amplify secret create <SECRET_NAME>' to create your secrets." 