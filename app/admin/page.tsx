"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import Image from "next/image";
import { useUser, useAuth } from "@clerk/nextjs";

// Define types for our data
interface UserData {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  createdAt: Date;
  lastSignInAt?: Date;
  totalLogosGenerated?: number;
}

interface LogoData {
  id: string;
  companyName: string;
  images: string[];
  timestamp: number;
  status: string;
  style: string;
  layout: string;
  businessType: string;
  prompt?: string;
  additionalInfo?: string;
  generationTime?: number;
  modelUsed?: string;
  userId: string;
}

interface LogoWithUserData extends LogoData {
  userEmail: string;
  userName: string;
}

interface ClerkUser {
  id: string;
  emailAddress?: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  createdAt: string;
  lastSignInAt?: string;
}

export default function AdminPage() {
  const { user, isLoaded: userLoaded } = useUser();
  const { getToken } = useAuth();
  
  // State for user data
  const [users, setUsers] = useState<UserData[]>([]);
  const [userMap, setUserMap] = useState<Map<string, UserData>>(new Map());
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    activeUsersToday: 0,
    newUsersToday: 0,
    totalLogosGenerated: 0
  });
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [userError, setUserError] = useState<string | null>(null);
  
  // Get logo data from Convex
  const recentLogos = useQuery(api.admin.getRecentLogos);
  
  // Fetch users from Clerk API
  useEffect(() => {
    async function fetchUsers() {
      if (!userLoaded || !user) return;
      
      try {
        setIsLoadingUsers(true);
        setUserError(null);
        
        // Get token for Clerk API (might be needed for future API calls)
        await getToken();
        
        // Check if user is admin (you might want to implement proper admin check)
        // For now, we'll assume the logged-in user is an admin
        
        // Get users from Clerk
        // We need to use the Clerk Backend API since the frontend SDK doesn't expose getUserList
        // This is a workaround for demo purposes - in production, you should use a backend API route
        const response = await fetch('/api/users');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch users: ${response.statusText}`);
        }
        
        const userList = await response.json() as ClerkUser[];
        
        // Process user data
        const userData: UserData[] = userList.map((u: ClerkUser) => {
          // Handle dates safely
          let lastSignInAt: Date | undefined = undefined;
          if (u.lastSignInAt) {
            lastSignInAt = new Date(u.lastSignInAt);
          }
          
          return {
            id: u.id,
            email: u.emailAddress || "No email",
            firstName: u.firstName || undefined,
            lastName: u.lastName || undefined,
            imageUrl: u.imageUrl,
            createdAt: new Date(u.createdAt),
            lastSignInAt,
            totalLogosGenerated: 0 // We'll calculate this from logo data
          };
        });
        
        // Create a map for quick lookup
        const userMapData = new Map<string, UserData>();
        userData.forEach(u => userMapData.set(u.id, u));
        
        // Calculate stats
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const stats = {
          totalUsers: userData.length,
          activeUsersToday: userData.filter(u => u.lastSignInAt && u.lastSignInAt >= today).length,
          newUsersToday: userData.filter(u => u.createdAt >= today).length,
          totalLogosGenerated: 0 // We'll calculate this from logo data
        };
        
        setUsers(userData);
        setUserMap(userMapData);
        setUserStats(stats);
      } catch (error) {
        console.error("Error fetching users:", error);
        setUserError(error instanceof Error ? error.message : "Failed to load users");
      } finally {
        setIsLoadingUsers(false);
      }
    }
    
    fetchUsers();
  }, [userLoaded, user, getToken]);
  
  // Calculate logo stats and join with user data
  useEffect(() => {
    if (!recentLogos?.success || !recentLogos.data || users.length === 0) return;
    
    // Create a stable reference to the current users array to prevent infinite loops
    const currentUsers = [...users];
    
    // Count logos per user
    const logoCountByUser = new Map<string, number>();
    
    recentLogos.data.forEach(logo => {
      if (!logo.userId) return;
      
      const currentCount = logoCountByUser.get(logo.userId) || 0;
      logoCountByUser.set(logo.userId, currentCount + 1);
    });
    
    // Check if we need to update users
    let needsUpdate = false;
    for (const user of currentUsers) {
      const logoCount = logoCountByUser.get(user.id) || 0;
      if (user.totalLogosGenerated !== logoCount) {
        needsUpdate = true;
        break;
      }
    }
    
    if (!needsUpdate) return;
    
    // Update user data with logo counts
    const updatedUsers = currentUsers.map(user => ({
      ...user,
      totalLogosGenerated: logoCountByUser.get(user.id) || 0
    }));
    
    // Update user map
    const updatedUserMap = new Map<string, UserData>();
    updatedUsers.forEach(u => updatedUserMap.set(u.id, u));
    
    // Calculate total logos
    const totalLogos = Array.from(logoCountByUser.values()).reduce((sum, count) => sum + count, 0);
    
    setUsers(updatedUsers);
    setUserMap(updatedUserMap);
    setUserStats(prev => ({ ...prev, totalLogosGenerated: totalLogos }));
  }, [recentLogos, users]);
  
  // Loading state for user data
  if (isLoadingUsers || !userLoaded) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center">Loading user data...</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Not signed in state
  if (!user) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center">Please sign in to access the admin dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // User error state
  if (userError) {
    return (
      <div className="container mx-auto p-4">
        <Card className="bg-red-900/20 border-red-500">
          <CardHeader>
            <CardTitle>Error Loading Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{userError}</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Error state for logos
  if (recentLogos?.success === false) {
    return (
      <div className="container mx-auto p-4">
        <Card className="bg-red-900/20 border-red-500">
          <CardHeader>
            <CardTitle>Error Loading Logos</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{recentLogos.error || "Unknown error"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Loading state for logo data
  if (!recentLogos) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center">Loading logo data...</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Join logo data with user data
  const logosWithUserData: LogoWithUserData[] = recentLogos.data.map(logo => {
    const userData = logo.userId ? userMap.get(logo.userId) : undefined;
    
    return {
      ...logo,
      userEmail: userData?.email || "Unknown",
      userName: userData ? `${userData.firstName || ''} ${userData.lastName || ''}`.trim() : "Unknown"
    };
  });
  
  // Render the admin dashboard
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Users" value={userStats.totalUsers} />
        <StatCard title="Active Users Today" value={userStats.activeUsersToday} />
        <StatCard title="New Users Today" value={userStats.newUsersToday} />
        <StatCard title="Total Logos Generated" value={userStats.totalLogosGenerated} />
      </div>
      
      {/* Main Content */}
      <Tabs defaultValue="logos" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="logos">Recent Logos</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>
        
        {/* Logos Tab */}
        <TabsContent value="logos">
          <Card>
            <CardHeader>
              <CardTitle>Recent Logo Generations</CardTitle>
              <CardDescription>
                Showing the most recent logo generations across all users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-6">
                  {logosWithUserData.map((logo) => (
                    <LogoCard key={logo.id} logo={logo} />
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                All users registered in your application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-4">
                  {users.map((user) => (
                    <UserCard key={user.id} user={user} />
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Stat Card Component
function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

// Logo Card Component
function LogoCard({ logo }: { logo: LogoWithUserData }) {
  // Function to format base64 image data properly
  const formatImageSrc = (imageData: string): string => {
    // Check if the image is already a URL (starts with http or https)
    if (imageData.startsWith('http://') || imageData.startsWith('https://')) {
      return imageData;
    }
    
    // Check if it's a base64 string without proper formatting
    if (imageData.startsWith('["') && imageData.includes('4QC8R')) {
      try {
        // Try to extract the base64 data from the string format
        const cleanedData = imageData.replace(/\[|"|\]/g, '');
        return `data:image/png;base64,${cleanedData}`;
      } catch (error) {
        console.error('Error formatting image data:', error);
        return '';
      }
    }
    
    // If it's already a properly formatted base64 string
    if (imageData.startsWith('data:image')) {
      return imageData;
    }
    
    // Assume it's a base64 string without the data:image prefix
    return `data:image/png;base64,${imageData}`;
  };
  
  return (
    <Card className="p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Logo Images */}
        <div className="flex flex-wrap gap-2">
          {logo.images && logo.images.length > 0 ? (
            logo.images.map((image: string, index: number) => {
              const formattedSrc = formatImageSrc(image);
              return formattedSrc ? (
                <div key={index} className="relative w-24 h-24 border rounded overflow-hidden">
                  <Image 
                    src={formattedSrc} 
                    alt={`${logo.companyName || 'Logo'} ${index + 1}`}
                    fill
                    className="object-contain"
                  />
                </div>
              ) : (
                <div key={index} className="w-24 h-24 border rounded flex items-center justify-center bg-gray-100">
                  <p className="text-xs text-gray-400">Invalid image</p>
                </div>
              );
            })
          ) : (
            <div className="w-24 h-24 border rounded flex items-center justify-center bg-gray-100">
              <p className="text-xs text-gray-400">No images</p>
            </div>
          )}
        </div>
        
        {/* Logo Details */}
        <div className="space-y-2">
          <h3 className="font-bold">{logo.companyName || "Unnamed Logo"}</h3>
          
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <p><span className="text-gray-400">Style:</span> {logo.style || "N/A"}</p>
            <p><span className="text-gray-400">Layout:</span> {logo.layout || "N/A"}</p>
            <p><span className="text-gray-400">Business:</span> {logo.businessType || "N/A"}</p>
            <p><span className="text-gray-400">Status:</span> {logo.status || "N/A"}</p>
          </div>
          
          <p className="text-xs text-gray-400">
            Generated: {new Date(logo.timestamp).toLocaleString()}
          </p>
        </div>
        
        {/* User & Additional Info */}
        <div className="space-y-2">
          <div>
            <h4 className="text-sm font-medium">User</h4>
            <p className="text-sm">{logo.userEmail || "Unknown"}</p>
            <p className="text-xs text-gray-400">ID: {logo.userId || "N/A"}</p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium">Generation Details</h4>
            <p className="text-xs"><span className="text-gray-400">Time:</span> {logo.generationTime ? `${logo.generationTime}ms` : "N/A"}</p>
            <p className="text-xs"><span className="text-gray-400">Model:</span> {logo.modelUsed || "N/A"}</p>
          </div>
          
          {logo.prompt && (
            <div>
              <h4 className="text-sm font-medium">Prompt</h4>
              <p className="text-xs line-clamp-2">{logo.prompt}</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

// User Card Component
function UserCard({ user }: { user: UserData }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-4">
        {/* User Avatar */}
        {user.imageUrl ? (
          <div className="relative w-12 h-12 rounded-full overflow-hidden">
            <Image 
              src={user.imageUrl} 
              alt={user.email}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-500 text-lg">
              {user.firstName?.[0] || user.email[0].toUpperCase()}
            </span>
          </div>
        )}
        
        {/* User Info */}
        <div className="flex-1">
          <h3 className="font-medium">
            {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email}
          </h3>
          <p className="text-sm text-gray-400">{user.email}</p>
        </div>
        
        {/* User Stats */}
        <div className="text-right">
          <p className="text-sm">Logos: {user.totalLogosGenerated || 0}</p>
          <p className="text-xs text-gray-400">
            Joined: {user.createdAt.toLocaleDateString()}
          </p>
        </div>
      </div>
    </Card>
  );
}