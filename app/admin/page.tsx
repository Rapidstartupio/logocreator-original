"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import Image from "next/image";
import { useUser, useAuth } from "@clerk/nextjs";
import { formatDistanceToNow } from "date-fns";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

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

interface PaginationData {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

// Function to format image source correctly
const formatImageSrc = (imageData: string): string => {
  if (!imageData) return "/placeholder.svg";
  
  // Check if the image is already a URL (starts with http or https)
  if (imageData.startsWith('http://') || imageData.startsWith('https://')) {
    return imageData;
  }
  
  // Check if it's a base64 string in JSON format (starts with [" and contains 4QC8R)
  if (imageData.startsWith('["') && imageData.includes('4QC8R')) {
    try {
      // Try to extract the base64 data from the string format
      const cleanedData = imageData.replace(/\[|"|\]/g, '');
      return `data:image/png;base64,${cleanedData}`;
    } catch (error) {
      console.error('Error formatting image data:', error);
      return '/placeholder.svg'; // Fallback to placeholder
    }
  }
  
  // If it's already a properly formatted base64 string
  if (imageData.startsWith('data:image')) {
    return imageData;
  }
  
  // Assume it's a base64 string without the data:image prefix
  return `data:image/png;base64,${imageData}`;
};

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
  
  // Pagination and search state
  const [userPagination, setUserPagination] = useState<PaginationData>({
    total: 0,
    limit: 10,
    offset: 0,
    hasMore: false
  });
  const [logoSearchTerm, setLogoSearchTerm] = useState("");
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [logoCursor, setLogoCursor] = useState<string | null>(null);
  const [hasMoreLogos, setHasMoreLogos] = useState(true);
  
  // Get logo data from Convex with search and pagination
  const recentLogos = useQuery(api.admin.getRecentLogos, {
    limit: 10,
    cursor: logoCursor || undefined,
    searchTerm: logoSearchTerm || undefined
  });
  
  // Get total logo count
  const logoCount = useQuery(api.admin.getTotalLogoCount);
  
  // Update total logos generated in stats
  useEffect(() => {
    if (logoCount?.success) {
      setUserStats(prev => ({
        ...prev,
        totalLogosGenerated: logoCount.count
      }));
    }
  }, [logoCount]);
  
  // Update cursor and hasMore state when logos data changes
  useEffect(() => {
    if (recentLogos?.success) {
      setHasMoreLogos(!!recentLogos.continueCursor);
      // Don't update cursor if we're on the first page and refreshing
      if (logoCursor !== null || !recentLogos.continueCursor) {
        setLogoCursor(recentLogos.continueCursor || null);
      }
    }
  }, [recentLogos, logoCursor]);
  
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
        
        // Get users from Clerk with pagination and search
        const response = await fetch(
          `/api/users?limit=${userPagination.limit}&offset=${userPagination.offset}${userSearchTerm ? `&query=${encodeURIComponent(userSearchTerm)}` : ''}`
        );
        
        if (!response.ok) {
          throw new Error(`Failed to fetch users: ${response.statusText}`);
        }
        
        const data = await response.json();
        const userList = data.users as ClerkUser[];
        const pagination = data.pagination as PaginationData;
        
        // Update pagination data
        setUserPagination(pagination);
        
        // Process user data
        const userData: UserData[] = userList.map((u: ClerkUser) => {
          return {
            id: u.id,
            email: u.emailAddress || "Unknown",
            firstName: u.firstName,
            lastName: u.lastName,
            imageUrl: u.imageUrl,
            createdAt: new Date(u.createdAt),
            lastSignInAt: u.lastSignInAt ? new Date(u.lastSignInAt) : undefined,
            totalLogosGenerated: 0 // We'll update this later if we have logo data
          };
        });
        
        // Create a map of users by ID for quick lookup
        const userMapData = new Map<string, UserData>();
        userData.forEach(u => userMapData.set(u.id, u));
        
        setUsers(userData);
        setUserMap(userMapData);
        setUserStats(prev => ({
          ...prev,
          totalUsers: pagination.total
        }));
      } catch (error) {
        console.error("Error fetching users:", error);
        setUserError(error instanceof Error ? error.message : "Unknown error");
      } finally {
        setIsLoadingUsers(false);
      }
    }
    
    fetchUsers();
  }, [userLoaded, user, getToken, userPagination.limit, userPagination.offset, userSearchTerm]);
  
  // Combine logo data with user data
  const logosWithUserData: LogoWithUserData[] = recentLogos?.success ? 
    recentLogos.data.map(logo => {
      const userData = userMap.get(logo.userId);
      return {
        ...logo,
        userEmail: userData?.email || "Unknown",
        userName: userData ? `${userData.firstName || ""} ${userData.lastName || ""}`.trim() : "Unknown"
      };
    }) : [];
  
  // Handle logo search
  const handleLogoSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Reset cursor to get first page of results with the search term
    setLogoCursor(null);
  };
  
  // Handle user search
  const handleUserSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Reset pagination offset to get first page of results with the search term
    setUserPagination(prev => ({
      ...prev,
      offset: 0
    }));
  };
  
  // Handle user pagination
  const handleUserPaginationChange = (direction: 'next' | 'prev') => {
    setUserPagination(prev => {
      if (direction === 'next' && prev.hasMore) {
        return {
          ...prev,
          offset: prev.offset + prev.limit
        };
      } else if (direction === 'prev' && prev.offset > 0) {
        return {
          ...prev,
          offset: Math.max(0, prev.offset - prev.limit)
        };
      }
      return prev;
    });
  };
  
  // Handle logo pagination
  const handleLogoPaginationChange = (direction: 'next' | 'prev') => {
    if (direction === 'next' && hasMoreLogos) {
      // Next page - cursor is already set by the useEffect
    } else if (direction === 'prev') {
      // Previous page - reset cursor to get first page
      setLogoCursor(null);
    }
  };
  
  if (!userLoaded) {
    return <div className="container mx-auto py-10">Loading...</div>;
  }
  
  if (!user) {
    return <div className="container mx-auto py-10">Please sign in to access the admin dashboard</div>;
  }
  
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Users" value={userStats.totalUsers} />
        <StatCard title="Active Users Today" value={userStats.activeUsersToday} />
        <StatCard title="New Users Today" value={userStats.newUsersToday} />
        <StatCard title="Total Logos Generated" value={userStats.totalLogosGenerated} />
      </div>
      
      <Tabs defaultValue="logos" className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="logos">Recent Logos</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>
        
        {/* Logos Tab */}
        <TabsContent value="logos">
          <div className="mb-4">
            <form onSubmit={handleLogoSearch} className="flex gap-2 mb-4">
              <Input 
                placeholder="Search by company name"
                value={logoSearchTerm}
                onChange={(e) => setLogoSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button type="submit">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </form>
            
            {/* Pagination Controls */}
            <div className="flex justify-between items-center mb-4">
              <Button 
                variant="outline" 
                onClick={() => handleLogoPaginationChange('prev')} 
                disabled={!logoCursor}
              >
                <ChevronLeft className="h-4 w-4 mr-2" /> Previous
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleLogoPaginationChange('next')} 
                disabled={!hasMoreLogos}
              >
                Next <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
          
          {recentLogos?.success === false && (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-red-500">Error Loading Logos</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{recentLogos.error || "Unknown error"}</p>
              </CardContent>
            </Card>
          )}
          
          {recentLogos?.success && logosWithUserData.length === 0 && (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>No Logos Found</CardTitle>
              </CardHeader>
              <CardContent>
                <p>No logos match your search criteria.</p>
              </CardContent>
            </Card>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentLogos?.success && logosWithUserData.map(logo => (
              <LogoCard key={logo.id} logo={logo} />
            ))}
          </div>
        </TabsContent>
        
        {/* Users Tab */}
        <TabsContent value="users">
          <div className="mb-4">
            <form onSubmit={handleUserSearch} className="flex gap-2 mb-4">
              <Input 
                placeholder="Search by name or email"
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button type="submit">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </form>
            
            {/* Pagination Controls */}
            <div className="flex justify-between items-center mb-4">
              <Button 
                variant="outline" 
                onClick={() => handleUserPaginationChange('prev')} 
                disabled={userPagination.offset === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-2" /> Previous
              </Button>
              <div className="text-sm">
                Showing {userPagination.offset + 1} - {Math.min(userPagination.offset + userPagination.limit, userPagination.total)} of {userPagination.total}
              </div>
              <Button 
                variant="outline" 
                onClick={() => handleUserPaginationChange('next')} 
                disabled={!userPagination.hasMore}
              >
                Next <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
          
          {userError && (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-red-500">Error Loading Users</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{userError}</p>
              </CardContent>
            </Card>
          )}
          
          {isLoadingUsers ? (
            <Card className="mb-4">
              <CardContent className="p-8 text-center">
                <p>Loading users...</p>
              </CardContent>
            </Card>
          ) : users.length === 0 ? (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>No Users Found</CardTitle>
              </CardHeader>
              <CardContent>
                <p>No users match your search criteria.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {users.map(user => (
                <UserCard key={user.id} user={user} />
              ))}
            </div>
          )}
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
        <div className="text-2xl font-bold">{value.toLocaleString()}</div>
      </CardContent>
    </Card>
  );
}

// Logo Card Component
function LogoCard({ logo }: { logo: LogoWithUserData }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold">{logo.companyName || "Unnamed Logo"}</CardTitle>
        <CardDescription>
          Created {formatDistanceToNow(new Date(logo.timestamp), { addSuffix: true })}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-2 gap-2 p-4">
          <div>
            {logo.images && logo.images.length > 0 ? (
              <div className="relative h-32 w-full">
                <Image 
                  src={formatImageSrc(logo.images[0])}
                  alt={logo.companyName || "Logo"}
                  fill
                  className="object-contain"
                />
              </div>
            ) : (
              <div className="h-32 w-full bg-gray-100 flex items-center justify-center text-gray-400">
                No Image
              </div>
            )}
          </div>
          <div className="space-y-1 text-sm">
            <p><span className="font-semibold">User:</span> {logo.userName || "Unknown"}</p>
            <p><span className="font-semibold">Email:</span> {logo.userEmail || "Unknown"}</p>
            <p><span className="font-semibold">Style:</span> {logo.style || "N/A"}</p>
            <p><span className="font-semibold">Layout:</span> {logo.layout || "N/A"}</p>
            <p><span className="font-semibold">Status:</span> {logo.status || "N/A"}</p>
          </div>
        </div>
        
        <div className="border-t p-4">
          <h4 className="font-semibold mb-1">Additional Details</h4>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <p><span className="font-semibold">Business Type:</span> {logo.businessType || "N/A"}</p>
            <p><span className="font-semibold">Model:</span> {logo.modelUsed || "N/A"}</p>
            <p><span className="font-semibold">Generation Time:</span> {logo.generationTime ? `${logo.generationTime}ms` : "N/A"}</p>
            <p><span className="font-semibold">Images:</span> {logo.images?.length || 0}</p>
          </div>
          
          {logo.additionalInfo && (
            <div className="mt-2">
              <h4 className="font-semibold mb-1">Notes</h4>
              <p className="text-sm">{logo.additionalInfo}</p>
            </div>
          )}
          
          {logo.prompt && (
            <div className="mt-2">
              <h4 className="font-semibold mb-1">Prompt</h4>
              <p className="text-sm">{logo.prompt}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// User Card Component
function UserCard({ user }: { user: UserData }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-4">
          {user.imageUrl && (
            <div className="relative h-12 w-12 rounded-full overflow-hidden">
              <Image 
                src={user.imageUrl}
                alt={`${user.firstName || ""} ${user.lastName || ""}`}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div>
            <CardTitle className="text-lg">
              {user.firstName || user.lastName ? 
                `${user.firstName || ""} ${user.lastName || ""}`.trim() : 
                "Unnamed User"}
            </CardTitle>
            <CardDescription>{user.email}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <p><span className="font-semibold">User ID:</span> {user.id}</p>
          <p><span className="font-semibold">Created:</span> {formatDistanceToNow(user.createdAt, { addSuffix: true })}</p>
          {user.lastSignInAt && (
            <p><span className="font-semibold">Last Sign In:</span> {formatDistanceToNow(user.lastSignInAt, { addSuffix: true })}</p>
          )}
          <p><span className="font-semibold">Logos Generated:</span> {user.totalLogosGenerated || 0}</p>
        </div>
      </CardContent>
    </Card>
  );
}