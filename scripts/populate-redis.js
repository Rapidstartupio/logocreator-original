import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get the directory name of the current module
const __dirname = dirname(fileURLToPath(import.meta.url));

// Load environment variables from .env
const envPath = resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

const UPSTASH_REDIS_REST_URL = "https://ethical-jennet-17428.upstash.io";
const UPSTASH_REDIS_REST_TOKEN = "AUQUAAIjcDE4ZGU1YjI4MDY1YzY0NjZiYmRhYjRmZTc4OWE1YjdkMHAxMA";

async function setUserCredits(userId, credits) {
  try {
    console.log(`Setting ${credits} credits for user ${userId}...`);
    
    const key = `logocreator:ratelimit:${userId}`;
    const value = JSON.stringify({
      tokens: credits,
      timestamp: Date.now()
    });
    
    // First set the value
    const setResponse = await fetch(`${UPSTASH_REDIS_REST_URL}/set/${key}/${encodeURIComponent(value)}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
      },
    });

    const setData = await setResponse.json();
    console.log(`Set response for user ${userId}:`, setData);

    // Then set the expiration
    const expireResponse = await fetch(`${UPSTASH_REDIS_REST_URL}/expire/${key}/5184000`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
      },
    });

    const expireData = await expireResponse.json();
    console.log(`Expire response for user ${userId}:`, expireData);

    // Verify the value was set
    const verifyResponse = await fetch(`${UPSTASH_REDIS_REST_URL}/get/${key}`, {
      headers: {
        'Authorization': `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
      },
    });

    const verifyData = await verifyResponse.json();
    console.log(`Verified value for user ${userId}:`, verifyData);

    try {
      const parsedValue = JSON.parse(verifyData.result);
      console.log(`Parsed value:`, parsedValue);
    } catch {
      console.log(`Raw value:`, verifyData.result);
    }
  } catch (error) {
    console.error('Error setting credits:', error);
  }
}

// Example usage:
// Replace these with actual user IDs and their desired credit amounts
const userCredits = {
  'user_2os1eaOKu1NrBBPsZuiyDdB37cW': 150,
  'user_2pCJ7BLKqgsCX0bJUvIgnXT2l4m': 150,
  'user_2pQu7SK5Z0rZwunr3UhNSNuIxzJ': 150,
  'user_2tJFUgEckpUi9hXliBEuNqc2EHq': 150,
  // Add more users as needed
};

// Set credits for each user
async function populateCredits() {
  for (const [userId, credits] of Object.entries(userCredits)) {
    await setUserCredits(userId, credits);
  }
}

// Run the script
populateCredits(); 