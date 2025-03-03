import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get the directory name of the current module
const __dirname = dirname(fileURLToPath(import.meta.url));

// Load environment variables from .env
const envPath = resolve(__dirname, '../.env');
console.log('Loading .env from:', envPath);
dotenv.config({ path: envPath });

// Use environment variables
const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

console.log('Environment variables loaded:', {
  UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: UPSTASH_REDIS_REST_TOKEN ? '***' : undefined
});

if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
  console.error('Missing required environment variables. Please check your .env file.');
  process.exit(1);
}

console.log('Using Redis URL:', UPSTASH_REDIS_REST_URL);

async function scanKeys(pattern = 'logocreator:*') {
  try {
    console.log('Making request to:', UPSTASH_REDIS_REST_URL);
    const response = await fetch(`${UPSTASH_REDIS_REST_URL}/scan`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        "cursor": 0,
        "match": pattern,
        "count": 100
      }),
    });

    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Full response data:', JSON.stringify(data, null, 2));

    if (!data.result) {
      console.log('No keys found or empty response');
      return;
    }

    // Get values for each key
    if (Array.isArray(data.result)) {
      for (const key of data.result) {
        const valueResponse = await fetch(`${UPSTASH_REDIS_REST_URL}/get/${key}`, {
          headers: {
            'Authorization': `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
          },
        });
        const value = await valueResponse.json();
        console.log(`${key}: `, value.result);
      }
    } else {
      console.log('Result is not an array:', data.result);
    }
  } catch (error) {
    console.error('Error:', error);
    // Log more details about the error
    if (error.response) {
      console.error('Response status:', error.response.status);
      const text = await error.response.text();
      console.error('Response text:', text);
    }
  }
}

// Run the script
scanKeys(); 