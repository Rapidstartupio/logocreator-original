"use client";

import React, { useState, Suspense, useEffect } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import { UserIcon, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import SimpleTest from "./simple-test";
import TestQuery from "./test-query";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Input } from "@/app/components/ui/input";

// Define types for our data
interface UserData {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  totalLogos: number;
  lastActive: string;
  isAdmin: boolean;
  credits: number;
}

interface LogoData {
  id: string;
  companyName: string;
  images: string[];
  timestamp: number;
  status: string;
  style: string;
  layout: string;
  businessType?: string;
  prompt?: string;
  additionalInfo?: string;
  generationTime?: number;
  modelUsed?: string;
  userId: string;
  userEmail: string;
}

interface ClerkUser {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  emailAddresses: Array<{emailAddress: string}>;
  imageUrl?: string;
  createdAt: string | Date;
  lastSignInAt?: string | Date | null;
}

interface PaginationData {
  totalUsers: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export default function AdminPage() {
  const { user } = useUser();
  const { signOut } = useAuth();
  
  // State for selected logo and user
  const [selectedLogo, setSelectedLogo] = useState<LogoData | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  
  // State for Clerk users
  const [clerkUsers, setClerkUsers] = useState<ClerkUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    activeUsersToday: 0,
    newUsersToday: 0,
    totalLogos: 0
  });
  
  // State for logos
  const [logos, setLogos] = useState<LogoData[]>([]);
  const [loadingLogos, setLoadingLogos] = useState(true);
  const [logoPagination, setLogoPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
    pageSize: 10,
    cursors: [] as string[] // Array to store cursors for each page
  });
  
  // State for error tracking
  const [apiError, setApiError] = useState<string | null>(null);
  
  // State for pagination and search
  const [pagination, setPagination] = useState<PaginationData>({
    totalUsers: 0,
    totalPages: 0,
    currentPage: 1,
    pageSize: 10,
    hasNextPage: false,
    hasPreviousPage: false
  });
  
  // State for search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>('');
  
  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  // Initialize user in Convex if needed
  const initializeUser = useMutation(api.admin.initializeUser);
  
  // Initialize user when component mounts if user exists
  useEffect(() => {
    if (user) {
      initializeUser({
        userId: user.id,
        email: user.primaryEmailAddress?.emailAddress || "unknown@example.com",
        isAdmin: true
      }).catch(error => {
        console.error("Error initializing user:", error);
      });
    }
  }, [user, initializeUser]);
  
  // Add state for selected tab
  const [selectedTab, setSelectedTab] = useState("overview");
  
  // Add Convex query for stats
  const statsQuery = useQuery(api.admin.getUserStats);
  
  // Add Convex query for recent logos (Overview tab)
  const recentLogosQuery = useQuery(api.admin.getRecentLogos, {
    paginationOpts: {
      numItems: 5,
      cursor: undefined
    }
  });

  // Add Convex query for all logos (Logos tab)
  const allLogosQuery = useQuery(api.admin.getRecentLogos, {
    paginationOpts: {
      numItems: logoPagination.pageSize,
      cursor: logoPagination.cursors[logoPagination.currentPage - 1]
    }
  });
  
  // Function to format image source correctly
  const formatImageSrc = (imageData: string): string => {
    if (!imageData) return "/placeholder.svg";
    
    // If it's already a data URL, return as is
    if (imageData.startsWith('data:image')) {
      return imageData;
    }
    
    // If it's a base64 string, add the data URL prefix
    if (imageData.includes('/9j/')) {
      return `data:image/jpeg;base64,${imageData}`;
    }
    
    // If it's a URL (e.g. from Clerk), return as is
    if (imageData.startsWith('http')) {
      return imageData;
    }
    
    // Default case: assume it's a base64 string
    return `data:image/png;base64,${imageData}`;
  };
  
  // Fetch Clerk users
  const fetchClerkUsers = async (page = 1, pageSize = 10, search = '') => {
    try {
      setLoadingUsers(true);
      setApiError(null);
      
      const response = await fetch(`/api/admin/users?page=${page}&pageSize=${pageSize}${search ? `&search=${encodeURIComponent(search)}` : ''}`);
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(`API error: ${data.error}`);
      }
      
      setClerkUsers(data.users || []);
      
      // Set pagination data if available
      if (data.pagination) {
        setPagination(data.pagination);
      }
      
      // Update user stats if on first page
      if (page === 1) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        const activeToday = data.users.filter((u: ClerkUser) => 
          u.lastSignInAt && new Date(u.lastSignInAt) >= today
        ).length;
        
        const newToday = data.users.filter((u: ClerkUser) => 
          new Date(u.createdAt) >= today
        ).length;
        
        setUserStats(prev => ({
          ...prev,
          totalUsers: data.pagination?.totalUsers || prev.totalUsers,
          activeUsersToday: activeToday,
          newUsersToday: newToday
        }));
      }
    } catch (error) {
      console.error("Error fetching Clerk users:", error);
      setApiError(error instanceof Error ? error.message : String(error));
      setClerkUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };
  
  // Handle logo page change
  const handleLogoPageChange = (newPage: number) => {
    if (newPage < 1) return;
    setLogoPagination(prev => ({
      ...prev,
      currentPage: newPage
    }));
  };
  
  // Update useEffect to handle both Convex and Clerk data
  useEffect(() => {
    if (user?.id) {
      // Fetch initial users data
      fetchClerkUsers(1, pagination.pageSize, debouncedSearchQuery);
      
      setLoadingLogos(true);
      
      // Update stats from getUserStats query
      if (statsQuery?.success) {
        setUserStats(prev => ({
          ...prev,
          ...statsQuery.stats
        }));
      }
      
      // Update logos based on which tab we're viewing
      const currentQuery = selectedTab === "overview" ? recentLogosQuery : allLogosQuery;
      
      if (currentQuery?.success) {
        interface LogoQueryResult {
          id: string;
          companyName?: string;
          images?: string[];
          timestamp?: number;
          status?: string;
          style?: string;
          layout?: string;
          businessType?: string;
          prompt?: string;
          additionalInfo?: string;
          generationTime?: number;
          modelUsed?: string;
          userId?: string;
          userEmail?: string;
        }

        const fetchedLogos = currentQuery.data.map((logo: LogoQueryResult) => ({
          id: logo.id || '',
          companyName: logo.companyName || 'Unnamed Logo',
          images: logo.images ? logo.images.map(img => formatImageSrc(img)) : [],
          timestamp: logo.timestamp || Date.now(),
          status: logo.status || 'unknown',
          style: logo.style || '',
          layout: logo.layout || '',
          businessType: logo.businessType || '',
          prompt: logo.prompt || '',
          additionalInfo: logo.additionalInfo || '',
          generationTime: logo.generationTime || 0,
          modelUsed: logo.modelUsed || '',
          userId: logo.userId || '',
          userEmail: logo.userEmail || 'Unknown'
        }));
        
        setLogos(fetchedLogos);
        
        // Update pagination state
        if (selectedTab === "logos" && 'continueCursor' in currentQuery) {
          setLogoPagination(prev => {
            const newCursors = [...prev.cursors];
            if (currentQuery.continueCursor) {
              newCursors[prev.currentPage] = currentQuery.continueCursor;
            }
            
            return {
              ...prev,
              cursors: newCursors,
              hasNextPage: currentQuery.continueCursor !== null,
              hasPreviousPage: prev.currentPage > 1,
              totalPages: prev.totalPages + (currentQuery.continueCursor ? 1 : 0)
            };
          });
        }
        
        // Update total count in stats
        if ('totalCount' in currentQuery && typeof currentQuery.totalCount === 'number') {
          setUserStats(prev => ({
            ...prev,
            totalLogos: currentQuery.totalCount
          }));
        }
      }
      
      setLoadingLogos(false);
    }
  }, [user?.id, recentLogosQuery, allLogosQuery, statsQuery, pagination.pageSize, debouncedSearchQuery, selectedTab, logoPagination.currentPage]);

  // Handle user selection
  const handleSelectUser = (clerkUser: ClerkUser) => {
    // Convert Clerk user to our UserData format
    const userData: UserData = {
      id: clerkUser.id,
      email: clerkUser.emailAddresses[0]?.emailAddress || "No email",
      firstName: clerkUser.firstName || undefined,
      lastName: clerkUser.lastName || undefined,
      profileImageUrl: clerkUser.imageUrl,
      totalLogos: 0, // We don't have this data yet
      lastActive: clerkUser.lastSignInAt ? new Date(clerkUser.lastSignInAt).toLocaleString() : "Never",
      isAdmin: false, // We don't have this data yet
      credits: 0 // We don't have this data yet
    };
    
    setSelectedUser(userData);
    setSelectedLogo(null);
  };
  
  // Handle logo selection
  const handleSelectLogo = (logo: LogoData) => {
    setSelectedLogo(logo);
    setSelectedUser(null);
  };
  
  // Function to refresh data
  const refreshData = () => {
    setLoadingLogos(true);
    fetchClerkUsers(1, pagination.pageSize, debouncedSearchQuery);
    setLogos([]);
    setLogoPagination(prev => ({
      ...prev,
      currentPage: 1,
      cursors: [],
      hasNextPage: false,
      hasPreviousPage: false
    }));
  };
  
  // Handle user pagination
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    fetchClerkUsers(newPage, pagination.pageSize, debouncedSearchQuery);
  };
  
  // Handle tab change
  const handleTabChange = (value: string) => {
    setSelectedTab(value);
    if (value === "logos") {
      // Reset pagination when switching to logos tab
      setLogoPagination(prev => ({
        ...prev,
        currentPage: 1,
        cursors: [],
        hasNextPage: false,
        hasPreviousPage: false
      }));
    }
  };
  
  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1 className="admin-title">Admin Dashboard</h1>
        <div className="admin-actions">
          <Link href="/admin/connection-fix" className="inline-block">
            <Button variant="outline">Connection Fix Tool</Button>
          </Link>
          <Button variant="outline" onClick={() => signOut()}>
            Sign Out
          </Button>
        </div>
      </header>
      
      <Tabs 
        defaultValue="overview" 
        className="admin-tabs w-full"
        onValueChange={handleTabChange}
      >
        <TabsList className="admin-tab-list grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="logos">Logos</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="admin-stats-grid">
            <div className="admin-stat-card">
              <div className="admin-stat-title">Total Users</div>
              <div className="admin-stat-value">{userStats.totalUsers}</div>
            </div>
            
            <div className="admin-stat-card">
              <div className="admin-stat-title">Active Today</div>
              <div className="admin-stat-value">{userStats.activeUsersToday}</div>
            </div>
            
            <div className="admin-stat-card">
              <div className="admin-stat-title">New Today</div>
              <div className="admin-stat-value">{userStats.newUsersToday}</div>
            </div>
            
            <div className="admin-stat-card">
              <div className="admin-stat-title">Total Logos</div>
              <div className="admin-stat-value">{userStats.totalLogos}</div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="admin-card">
              <div className="admin-card-header">
                <div className="admin-card-title">Recent Logos</div>
              </div>
              <div className="admin-card-content">
                {loadingLogos ? (
                  <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : apiError ? (
                  <div className="flex items-center justify-center h-40 flex-col">
                    <p className="text-red-500 mb-2">Error loading logos</p>
                    <p className="text-gray-500 text-sm">{apiError}</p>
                    <Button 
                      variant="outline" 
                      className="mt-4" 
                      onClick={refreshData}
                    >
                      Retry
                    </Button>
                  </div>
                ) : logos.length > 0 ? (
                  <div className="space-y-4">
                    {logos.map((logo) => (
                      <div 
                        key={logo.id} 
                        className="flex items-center space-x-4 cursor-pointer hover:bg-gray-800 dark:hover:bg-gray-700 p-2 rounded transition-colors duration-200" 
                        onClick={() => handleSelectLogo(logo)}
                      >
                        <div className="relative w-12 h-12 rounded overflow-hidden bg-gray-100 dark:bg-gray-800">
                          {logo.images && logo.images.length > 0 ? (
                            <Image 
                              src={logo.images[0]} 
                              alt={logo.companyName} 
                              fill 
                              className="object-contain"
                              unoptimized
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">
                              <span>No img</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{logo.companyName}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(logo.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    {userStats.totalLogos > 5 && (
                      <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
                        Showing 5 of {userStats.totalLogos} logos
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-40">
                    <p className="text-gray-500">No logos found</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="admin-card">
              <div className="admin-card-header">
                <div className="admin-card-title">Recent Users</div>
              </div>
              <div className="admin-card-content">
                {loadingUsers ? (
                  <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : apiError ? (
                  <div className="flex items-center justify-center h-40 flex-col">
                    <p className="text-red-500 mb-2">Error loading users</p>
                    <p className="text-gray-500 text-sm">{apiError}</p>
                  </div>
                ) : clerkUsers.length > 0 ? (
                  <div className="space-y-4">
                    {clerkUsers.slice(0, 5).map((clerkUser) => (
                      <div key={clerkUser.id} className="flex items-center space-x-4">
                        <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-100">
                          {clerkUser.imageUrl ? (
                            <Image 
                              src={clerkUser.imageUrl} 
                              alt={clerkUser.firstName || "User"} 
                              fill 
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">
                              <UserIcon size={20} />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">
                            {clerkUser.firstName && clerkUser.lastName 
                              ? `${clerkUser.firstName} ${clerkUser.lastName}` 
                              : clerkUser.emailAddresses[0]?.emailAddress || "Unknown User"}
                          </p>
                          <p className="text-sm text-gray-500">
                            {clerkUser.lastSignInAt 
                              ? `Last active: ${new Date(clerkUser.lastSignInAt).toLocaleDateString()}`
                              : "Never signed in"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-40">
                    <p className="text-gray-500">No users found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="logos" className="space-y-4">
          <div className="admin-card">
            <div className="admin-card-header admin-flex admin-justify-between admin-items-center">
              <div className="admin-card-title">All Logos</div>
              <div className="admin-flex admin-gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={refreshData}
                  disabled={loadingLogos}
                >
                  Refresh
                </Button>
              </div>
            </div>
            <div className="admin-card-content">
              {selectedLogo ? (
                <div>
                  <Button 
                    variant="link" 
                    onClick={() => setSelectedLogo(null)} 
                    className="mb-4 p-0"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back to logos
                  </Button>
                  <LogoDetails logo={selectedLogo} />
                </div>
              ) : (
                <>
                  {loadingLogos ? (
                    <div className="space-y-4">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ) : apiError ? (
                    <div className="admin-flex admin-flex-col admin-items-center admin-justify-between p-8">
                      <p className="text-red-500 mb-2">Error loading logos</p>
                      <p className="text-gray-500 text-sm">{apiError}</p>
                      <Button 
                        variant="outline" 
                        className="mt-4" 
                        onClick={refreshData}
                      >
                        Retry
                      </Button>
                    </div>
                  ) : logos.length > 0 ? (
                    <>
                      <div className="space-y-4">
                        {logos.map((logo) => (
                          <div 
                            key={logo.id} 
                            className="admin-flex admin-items-center space-x-4 cursor-pointer hover:bg-gray-800 dark:hover:bg-gray-700 p-2 rounded transition-colors duration-200"
                            onClick={() => handleSelectLogo(logo)}
                          >
                            <div className="relative w-12 h-12 rounded overflow-hidden bg-gray-100 dark:bg-gray-800">
                              {logo.images && logo.images.length > 0 ? (
                                <Image 
                                  src={logo.images[0]} 
                                  alt={logo.companyName} 
                                  fill 
                                  className="object-contain" 
                                />
                              ) : (
                                <div className="flex items-center justify-center h-full w-full bg-gray-700 text-gray-400">
                                  <UserIcon className="h-6 w-6" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{logo.companyName}</p>
                              <p className="text-sm text-gray-400 truncate">
                                {new Date(logo.timestamp).toLocaleString()}
                              </p>
                            </div>
                            <div className="text-sm text-gray-400">
                              {logo.status}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Logo pagination controls */}
                      <div className="admin-flex admin-justify-between admin-items-center mt-4">
                        <div className="text-sm text-gray-400">
                          Page {logoPagination.currentPage} of {logoPagination.totalPages}
                        </div>
                        <div className="admin-flex admin-gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleLogoPageChange(logoPagination.currentPage - 1)}
                            disabled={!logoPagination.hasPreviousPage || loadingLogos}
                          >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleLogoPageChange(logoPagination.currentPage + 1)}
                            disabled={!logoPagination.hasNextPage || loadingLogos}
                          >
                            Next
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-40">
                      <p className="text-gray-500">No logos found</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="users" className="space-y-4">
          <div className="admin-card">
            <div className="admin-card-header admin-flex admin-justify-between admin-items-center">
              <div className="admin-card-title">All Users</div>
              <div className="admin-flex admin-gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    type="search"
                    placeholder="Search users..."
                    className="pl-8 w-[200px] md:w-[300px]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      className="absolute right-2.5 top-2.5 text-gray-500 hover:text-gray-700"
                      onClick={() => setSearchQuery('')}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => fetchClerkUsers(1, pagination.pageSize, debouncedSearchQuery)}
                  disabled={loadingUsers}
                >
                  Refresh
                </Button>
              </div>
            </div>
            <div className="admin-card-content">
              {selectedUser ? (
                <div>
                  <Button 
                    variant="link" 
                    onClick={() => setSelectedUser(null)} 
                    className="mb-4 p-0"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back to users
                  </Button>
                  <UserDetails user={selectedUser} />
                </div>
              ) : (
                <>
                  {loadingUsers ? (
                    <div className="space-y-4">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ) : apiError ? (
                    <div className="admin-flex admin-flex-col admin-items-center admin-justify-between p-8">
                      <p className="text-red-500 mb-2">Error loading users</p>
                      <p className="text-gray-500 text-sm">{apiError}</p>
                      <Button 
                        variant="outline" 
                        className="mt-4" 
                        onClick={() => fetchClerkUsers(1, pagination.pageSize, debouncedSearchQuery)}
                      >
                        Retry
                      </Button>
                    </div>
                  ) : clerkUsers.length > 0 ? (
                    <>
                      <div className="space-y-4">
                        {clerkUsers.map((user) => (
                          <div 
                            key={user.id} 
                            className="admin-flex admin-items-center space-x-4 cursor-pointer hover:bg-gray-800 dark:hover:bg-gray-700 p-2 rounded transition-colors duration-200"
                            onClick={() => handleSelectUser(user)}
                          >
                            <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                              {user.imageUrl ? (
                                <Image 
                                  src={user.imageUrl} 
                                  alt={user.firstName || 'User'} 
                                  fill 
                                  className="object-cover" 
                                />
                              ) : (
                                <div className="flex items-center justify-center h-full w-full bg-gray-700 text-gray-400">
                                  <UserIcon className="h-6 w-6" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">
                                {user.firstName && user.lastName 
                                  ? `${user.firstName} ${user.lastName}` 
                                  : user.emailAddresses[0]?.emailAddress || 'Unknown User'}
                              </p>
                              <p className="text-sm text-gray-400 truncate">
                                {user.emailAddresses[0]?.emailAddress}
                              </p>
                            </div>
                            <div className="text-sm text-gray-400">
                              {user.lastSignInAt 
                                ? new Date(user.lastSignInAt).toLocaleDateString() 
                                : 'Never'}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Pagination controls */}
                      <div className="admin-flex admin-justify-between admin-items-center mt-4">
                        <div className="text-sm text-gray-400">
                          Showing {clerkUsers.length} of {pagination.totalUsers} users
                        </div>
                        <div className="admin-flex admin-gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(pagination.currentPage - 1)}
                            disabled={!pagination.hasPreviousPage || loadingUsers}
                          >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(pagination.currentPage + 1)}
                            disabled={!pagination.hasNextPage || loadingUsers}
                          >
                            Next
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-40">
                      <p className="text-gray-500">No users found</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="diagnostics">
          <div className="admin-card">
            <div className="admin-card-header">
              <div className="admin-card-title">System Diagnostics</div>
            </div>
            <div className="admin-card-content">
              <Suspense fallback={<DiagnosticsSkeleton />}>
                <Diagnostics />
              </Suspense>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Logo Details Component
function LogoDetails({ logo }: { logo: LogoData }) {
  const [userData, setUserData] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
  } | null>(null);

  useEffect(() => {
    async function fetchUserData() {
      try {
        // The logo.userId is the same as Clerk's id
        const response = await fetch(`/api/admin/users/${logo.userId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            setUserData({
              firstName: data.user.firstName,
              lastName: data.user.lastName,
              email: data.user.emailAddresses?.[0]?.emailAddress
            });
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    }

    if (logo.userId) {
      fetchUserData();
    }
  }, [logo.userId]);

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => window.history.back()} className="mb-4">
        Back to Logos
      </Button>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">{logo.companyName}</h2>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</h3>
              <p className="text-gray-900 dark:text-gray-100">{logo.status}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</h3>
              <p className="text-gray-900 dark:text-gray-100">{new Date(logo.timestamp).toLocaleString()}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Style</h3>
              <p className="text-gray-900 dark:text-gray-100">{logo.style}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Layout</h3>
              <p className="text-gray-900 dark:text-gray-100">{logo.layout}</p>
            </div>
            {logo.businessType && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Business Type</h3>
                <p className="text-gray-900 dark:text-gray-100">{logo.businessType}</p>
              </div>
            )}
            {logo.generationTime && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Generation Time</h3>
                <p className="text-gray-900 dark:text-gray-100">{logo.generationTime}ms</p>
              </div>
            )}
            {logo.modelUsed && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Model</h3>
                <p className="text-gray-900 dark:text-gray-100">{logo.modelUsed}</p>
              </div>
            )}
          </div>
          
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">User</h3>
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
              <p className="text-gray-900 dark:text-gray-100">
                <strong>Name:</strong> {userData ? `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Not provided' : 'Loading...'}
              </p>
              <p className="text-gray-900 dark:text-gray-100">
                <strong>Email:</strong> {userData?.email || 'Loading...'}
              </p>
              <p className="text-gray-900 dark:text-gray-100">
                <strong>ID:</strong> {logo.userId}
              </p>
            </div>
          </div>
          
          {logo.prompt && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Prompt</h3>
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                <p className="text-gray-900 dark:text-gray-100">{logo.prompt}</p>
              </div>
            </div>
          )}
          
          {logo.additionalInfo && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Additional Info</h3>
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                <p className="text-gray-900 dark:text-gray-100">{logo.additionalInfo}</p>
              </div>
            </div>
          )}
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">Images</h3>
          <div className="grid grid-cols-1 gap-4">
            {logo.images && logo.images.length > 0 ? (
              logo.images.map((image, index) => (
                <div key={index} className="relative aspect-square bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
                  <Image 
                    src={image} 
                    alt={`${logo.companyName} - Image ${index + 1}`} 
                    fill 
                    className="object-contain"
                  />
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center h-64 bg-gray-100 dark:bg-gray-800 rounded">
                <p className="text-gray-500 dark:text-gray-400">No images available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// User Details Component
function UserDetails({ user }: { user: UserData }) {
  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => window.history.back()} className="mb-4">
        Back to Users
      </Button>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="flex justify-center mb-4">
              <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-200">
                {user.profileImageUrl ? (
                  <Image 
                    src={user.profileImageUrl} 
                    alt={user.email} 
                    fill 
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <UserIcon size={40} />
                  </div>
                )}
              </div>
            </div>
            
            <h2 className="text-xl font-bold text-center mb-2">
              {user.firstName && user.lastName 
                ? `${user.firstName} ${user.lastName}` 
                : user.email}
            </h2>
            <p className="text-center text-gray-500 mb-4">{user.email}</p>
            
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-white p-2 rounded">
                <p className="text-sm text-gray-500">Logos</p>
                <p className="font-bold">{user.totalLogos}</p>
              </div>
              <div className="bg-white p-2 rounded">
                <p className="text-sm text-gray-500">Credits</p>
                <p className="font-bold">{user.credits}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>User Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">User ID</h3>
                  <p className="font-mono text-sm">{user.id}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Email</h3>
                  <p>{user.email}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Name</h3>
                  <p>
                    {user.firstName && user.lastName 
                      ? `${user.firstName} ${user.lastName}` 
                      : "Not provided"}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Last Active</h3>
                  <p>{user.lastActive}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Admin Status</h3>
                  <p>{user.isAdmin ? "Admin" : "Regular User"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Diagnostics Component
function Diagnostics() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Authentication Test</CardTitle>
        </CardHeader>
        <CardContent>
          <SimpleTest />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Convex Test</CardTitle>
        </CardHeader>
        <CardContent>
          <TestQuery />
        </CardContent>
      </Card>
    </div>
  );
}

// Skeleton for diagnostics loading state
function DiagnosticsSkeleton() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}