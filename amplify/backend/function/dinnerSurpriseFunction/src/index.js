/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */

const AWS = require('aws-sdk');
const SSM = AWS.SSM;
const ssm = new AWS.SSM();

// Cache for secret values
const secretCache = {};

// Function to get secret from Parameter Store
async function getSecret(name) {
  if (secretCache[name]) {
    return secretCache[name];
  }

  try {
    const parameter = await ssm.getParameter({
      Name: `/amplify/app/prod/${name}`,
      WithDecryption: true
    }).promise();
    
    secretCache[name] = parameter.Parameter.Value;
    return secretCache[name];
  } catch (error) {
    console.error(`Error retrieving secret ${name}:`, error);
    return null;
  }
}

exports.handler = async (event) => {
  console.log(`EVENT: ${JSON.stringify(event)}`);

  try {
    // Example: Retrieving a secret when needed
    // const stripeSecretKey = await getSecret('STRIPE_SECRET_KEY');
    
    // Route based on the path
    const path = event.path;
    const method = event.httpMethod;
    
    if (path === '/api/health') {
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "*"
        }, 
        body: JSON.stringify({ status: 'healthy' }),
      };
    }
    
    // Add more API routes as needed
    
    return {
      statusCode: 404,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*"
      },
      body: JSON.stringify({ error: 'Not Found' }),
    };
  } catch (error) {
    console.error('Error processing request:', error);
    
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*"
      },
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
}; 