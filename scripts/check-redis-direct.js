import fetch from 'node-fetch';

const UPSTASH_REDIS_REST_URL = "https://ethical-jennet-17428.upstash.io";
const UPSTASH_REDIS_REST_TOKEN = "AUQUAAIjcDE4ZGU1YjI4MDY1YzY0NjZiYmRhYjRmZTc4OWE1YjdkMHAxMA";

async function scanKeys(pattern = 'logocreator:*') {
  try {
    console.log('Making request to:', UPSTASH_REDIS_REST_URL);
    
    // First try to list all keys
    const keysResponse = await fetch(`${UPSTASH_REDIS_REST_URL}/keys`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        "key": pattern
      }),
    });

    console.log('Response status:', keysResponse.status);
    const keysData = await keysResponse.json();
    console.log('Full response data:', JSON.stringify(keysData, null, 2));

    if (!keysData.result || !Array.isArray(keysData.result)) {
      console.log('No keys found or invalid response');
      return;
    }

    // Get values for each key
    for (const key of keysData.result) {
      const valueResponse = await fetch(`${UPSTASH_REDIS_REST_URL}/get`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          "key": key
        }),
      });
      const value = await valueResponse.json();
      console.log(`${key}: `, value.result);
    }
  } catch (error) {
    console.error('Error:', error);
    if (error.response) {
      console.error('Response status:', error.response.status);
      const text = await error.response.text();
      console.error('Response text:', text);
    }
  }
}

// Run the script
scanKeys(); 