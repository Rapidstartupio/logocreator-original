import { NextResponse } from 'next/server';
import { clerkClient, User } from '@clerk/nextjs/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

// Create a Convex client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: Request) {
  try {
    // Get the request body
    const { auth } = await request.json();
    
    if (auth !== 'admin_sync') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get all users from Clerk with pagination
    try {
      const allUsers: User[] = [];
      let hasMore = true;
      let pageNumber = 1;
      
      while (hasMore) {
        const usersResponse = await clerkClient.users.getUserList({
          limit: 100,
          offset: (pageNumber - 1) * 100,
        });
        
        allUsers.push(...usersResponse.data);
        console.log(`Fetched page ${pageNumber} with ${usersResponse.data.length} users`);
        
        // Check if we have more pages
        hasMore = usersResponse.data.length === 100;
        pageNumber++;
      }
      
      console.log(`Found ${allUsers.length} total users in Clerk`);
      
      // Create a batch of user data for Convex
      const userData = allUsers.map(user => ({
        userId: user.id,
        email: user.emailAddresses[0]?.emailAddress || 'no-email',
        isAdmin: user.emailAddresses[0]?.emailAddress === 'admin@admin.com'
      }));
      
      // Sync to Convex in batches of 50 to prevent overwhelming the system
      const batchSize = 50;
      const batches = [];
      
      for (let i = 0; i < userData.length; i += batchSize) {
        const batch = userData.slice(i, i + batchSize);
        batches.push(batch);
      }
      
      // Process each batch
      let syncedUsers = 0;
      for (const batch of batches) {
        try {
          const result = await convex.mutation(api.admin.syncClerkUsers, { 
            usersData: batch,
            adminKey: process.env.CONVEX_ADMIN_KEY || 'dev_admin'
          });
          syncedUsers += result.userCount || 0;
          console.log(`Synced batch of ${result.userCount} users`);
        } catch (error) {
          console.error('Error processing batch:', error);
          // Continue with next batch even if one fails
        }
      }
      
      return NextResponse.json({ 
        success: true, 
        totalUsers: allUsers.length,
        syncedUsers 
      });
    } catch (clerkError) {
      console.error('Error fetching users from Clerk:', clerkError);
      return NextResponse.json({ 
        error: 'Error fetching users from Clerk. Note: Clerk must be in production mode to fetch all users.' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in sync-users route:', error);
    return NextResponse.json({ 
      error: String(error),
      note: 'If using Clerk in dev mode, switch to production mode to access all users.'
    }, { status: 500 });
  }
} 