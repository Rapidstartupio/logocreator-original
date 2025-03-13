import { clerkClient } from "@clerk/clerk-sdk-node";

async function syncClerkUsers() {
  try {
    console.log('Starting Clerk users sync...');
    
    // Get all users from Clerk
    const response = await clerkClient.users.getUserList();
    const users = response.data;
    console.log(`Found ${users.length} users`);
    
    let updatedCount = 0;
    let errorCount = 0;
    
    // Process each user
    for (const user of users) {
      try {
        const metadata = user.unsafeMetadata || {};
        let needsUpdate = false;
        
        // Check if required fields exist and are of correct type
        if (metadata.remaining === undefined || typeof metadata.remaining !== 'number') {
          metadata.remaining = 3; // Set default credits for new users
          needsUpdate = true;
        }
        
        if (metadata.hasApiKey === undefined) {
          metadata.hasApiKey = false;
          needsUpdate = true;
        }
        
        // Update user if needed
        if (needsUpdate) {
          await clerkClient.users.updateUser(user.id, {
            unsafeMetadata: metadata
          });
          updatedCount++;
          console.log(`Updated user ${user.id} (${user.emailAddresses[0]?.emailAddress || 'no email'})`);
        }
      } catch (error) {
        console.error(`Error processing user ${user.id}:`, error);
        errorCount++;
      }
    }
    
    console.log('\nSync completed:');
    console.log(`- Total users: ${users.length}`);
    console.log(`- Updated users: ${updatedCount}`);
    console.log(`- Errors: ${errorCount}`);
    
  } catch (error) {
    console.error('Failed to sync users:', error);
  }
}

// Run the script
syncClerkUsers(); 