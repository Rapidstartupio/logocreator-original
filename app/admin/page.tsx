"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { useUser } from "@clerk/nextjs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import Image from "next/image";
import { Id } from "@/convex/_generated/dataModel";
import ConvexErrorBoundary from "./error-boundary";
import React from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

interface User {
  _id: Id<"userAnalytics">;
  _creationTime: number;
  userId: string;
  email: string;
  totalLogosGenerated: number;
  lastActive: number;
  lastCompanyName: string;
  lastBusinessType: string;
  lastLogoTimestamp: number;
  needsSync?: boolean;
}

// At the beginning of the file, add these type definitions for table data
interface TableRecord {
  _id: unknown;
  _creationTime: number | string;
  [key: string]: unknown;
}

// This needs to match the actual data from the Convex query
interface LogoRecord {
  _id: unknown;
  _creationTime: number;
  userId: string;
  companyName: string;
  layout: string;
  style: string;
  primaryColor: string;
  backgroundColor: string;
  additionalInfo: string;
  images: string[];
  timestamp: number;
}

function AdminDashboardContent() {
  const { user, isLoaded } = useUser();
  const [selectedTab, setSelectedTab] = useState("overview");
  const [syncStatus, setSyncStatus] = useState({ loading: false, message: "" });
  const [syncAllStatus, setSyncAllStatus] = useState({ loading: false, message: "" });
  const [sampleStatus, setSampleStatus] = useState({ loading: false, message: "" });
  const [sampleCompany, setSampleCompany] = useState("Sample Company");
  
  // Database explorer state
  const [selectedTable, setSelectedTable] = useState("logoHistory");
  const [recordLimit, setRecordLimit] = useState(100);
  
  // Try-catch blocks for queries to handle server errors
  const [usersError, setUsersError] = useState(false);
  const [logosError, setLogosError] = useState(false);
  const [statsError, setStatsError] = useState(false);
  const [tablesError, setTablesError] = useState(false);
  const [tableDataError, setTableDataError] = useState(false);
  const [accessError, setAccessError] = useState(false);
  
  // Use the enhanced users query with error state handling
  const rawUsers = useQuery(api.admin.getUsersWithLogoData);
  const recentLogos = useQuery(api.admin.getRecentLogos, { limit: 50 });
  const dailyStats = useQuery(api.admin.getDailyStats);
  const tables = useQuery(api.admin.getAllTables);
  const tableData = useQuery(api.admin.getAllTableData, 
    selectedTable ? { tableName: selectedTable, limit: recordLimit } : "skip"
  );
  const testAccess = useQuery(api.admin.testAdminAccess);

  // Handle all query errors in a single useEffect
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (rawUsers === undefined && !usersError) setUsersError(true);
      if (recentLogos === undefined && !logosError) setLogosError(true);
      if (dailyStats === undefined && !statsError) setStatsError(true);
      if (tables === undefined && !tablesError) setTablesError(true);
      if (tableData === undefined && selectedTable && !tableDataError) setTableDataError(true);
      if (testAccess === undefined && !accessError) setAccessError(true);
    }, 1000); // Increased timeout to give more time for data to load

    return () => clearTimeout(timeoutId);
  }, [rawUsers, recentLogos, dailyStats, tables, tableData, testAccess, selectedTable, 
      usersError, logosError, statsError, tablesError, tableDataError, accessError]);
  
  const users = usersError ? [] : (rawUsers as (User & { needsSync?: boolean })[] | undefined);
  
  // Mutations
  const syncUsers = useMutation(api.admin.syncClerkUsers);
  const createSampleLogo = useMutation(api.admin.createSampleLogo);

  // Function to sync Clerk users with Convex (current user only)
  const handleSyncUsers = async () => {
    try {
      setSyncStatus({ loading: true, message: "Syncing users..." });
      
      // Since we can't directly access Clerk's users list in client components,
      // we'll create a test user for demonstration
      const usersData = [
        {
          userId: user?.id || "unknown",
          email: user?.emailAddresses?.[0]?.emailAddress || "admin@admin.com",
          isAdmin: user?.emailAddresses?.[0]?.emailAddress === "admin@admin.com"
        }
      ];
      
      // Call the Convex mutation to sync users
      const result = await syncUsers({ 
        usersData,
        adminKey: 'dev_admin'
      });
      
      setSyncStatus({ 
        loading: false, 
        message: `Successfully synced ${result.userCount} users!` 
      });
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setSyncStatus({ loading: false, message: "" });
      }, 3000);
    } catch (error) {
      console.error("Error syncing users:", error);
      setSyncStatus({ 
        loading: false, 
        message: `Error: ${error instanceof Error ? error.message : String(error)}` 
      });
    }
  };

  // Function to sync ALL Clerk users with Convex via API
  const handleSyncAllUsers = async () => {
    try {
      setSyncAllStatus({ loading: true, message: "Syncing all users from Clerk..." });
      
      const response = await fetch('/api/admin/sync-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          auth: 'admin_sync',
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        let errorMessage = data.error;
        if (data.note) {
          errorMessage += `\n${data.note}`;
        }
        throw new Error(errorMessage);
      }
      
      setSyncAllStatus({ 
        loading: false, 
        message: `Successfully synced ${data.syncedUsers} of ${data.totalUsers} users!` 
      });
      
      // Clear message after 5 seconds
      setTimeout(() => {
        setSyncAllStatus({ loading: false, message: "" });
      }, 5000);
    } catch (error) {
      console.error("Error syncing all users:", error);
      setSyncAllStatus({ 
        loading: false, 
        message: `Error: ${error instanceof Error ? error.message : String(error)}` 
      });
      
      // Keep error message visible for longer
      setTimeout(() => {
        setSyncAllStatus({ loading: false, message: "" });
      }, 10000);
    }
  };

  // Function to create a sample logo
  const handleCreateSampleLogo = async (userId: string) => {
    if (!userId) return;
    
    try {
      setSampleStatus({ loading: true, message: "Creating sample logo..." });
      
      await createSampleLogo({
        userId,
        companyName: sampleCompany,
        businessType: "Technology",
      });
      
      setSampleStatus({
        loading: false,
        message: "Sample logo created successfully!"
      });
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setSampleStatus({ loading: false, message: "" });
      }, 3000);
    } catch (error) {
      console.error("Error creating sample logo:", error);
      setSampleStatus({
        loading: false,
        message: `Error: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  };

  // Helper to format time
  const formatTime = (timestamp: number) => {
    try {
      return format(new Date(timestamp), "MM/dd/yyyy HH:mm:ss");
    } catch {
      return "Invalid date";
    }
  };

  // Helper to render a value in a table cell
  const renderValue = (value: unknown): React.ReactNode => {
    if (value === null || value === undefined) {
      return <span className="text-gray-400">null</span>;
    }
    
    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        if (value.length === 0) {
          return <span className="text-gray-400">[ ]</span>;
        }
        
        // If it's an array of strings that look like image URLs or base64 data
        if (value.every((item): item is string => typeof item === 'string' && 
                      (item.startsWith('http') || item.includes('placehold.co') || item.startsWith('iVBOR')))) {
          return (
            <div className="flex flex-wrap gap-1">
              {value.map((url, i) => (
                <div key={i} className="relative h-10 w-10 overflow-hidden rounded border">
                  <Image 
                    src={url.startsWith('http') ? url : `data:image/png;base64,${url}`}
                    alt={`Image ${i}`} 
                    fill 
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          );
        }
        
        return (
          <div>
            <span className="text-blue-500 cursor-help">
              Array[{value.length}]
            </span>
          </div>
        );
      }
      
      return (
        <div>
          <span className="text-blue-500 cursor-help">
            {"{Object}"}
          </span>
        </div>
      );
    }
    
    // For timestamp fields, show formatted date
    if (typeof value === 'number' && 
        (String(value).length === 13 || String(value).length === 10) && 
        (new Date(value).getFullYear() > 2000)) {
      return formatTime(value);
    }
    
    return String(value);
  };

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  // Extract column names from the first record
  const columns = tableData && tableData.length > 0 
    ? Object.keys(tableData[0]).filter(key => key !== '_id') 
    : [];

  return (
    <div className="min-h-screen bg-[#343434] p-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>
        
        <div className="flex flex-wrap gap-4 mb-8">
          <Button 
            onClick={handleSyncUsers} 
            disabled={syncStatus.loading}
            className="bg-blue-900 hover:bg-blue-800"
          >
            {syncStatus.loading ? "Syncing..." : "Sync Current User"}
          </Button>
          
          <Button 
            onClick={handleSyncAllUsers} 
            disabled={syncAllStatus.loading}
            variant="secondary"
            className="bg-blue-900 hover:bg-blue-800 text-white"
          >
            {syncAllStatus.loading ? "Syncing..." : `Sync ALL Clerk Users`}
          </Button>
        </div>
        
        {syncStatus.message && (
          <div className="bg-green-100 text-green-800 p-2 rounded mb-4">
            {syncStatus.message}
          </div>
        )}
        
        {syncAllStatus.message && (
          <div className="bg-green-100 text-green-800 p-2 rounded mb-4">
            {syncAllStatus.message}
          </div>
        )}
        
        <div className="flex gap-2 items-center mb-8">
          <div>Logged in as: {user?.emailAddresses?.[0]?.emailAddress}</div>
          {accessError ? (
            <div className="text-amber-500">
              ⚠️ Admin access denied - Please ensure you are logged in as admin@admin.com
            </div>
          ) : testAccess ? (
            <div className="text-green-500">✓ Connected to Convex as admin - Found {testAccess.recordCount} records</div>
          ) : (
            <div className="text-red-500">✖ Not connected to Convex as admin</div>
          )}
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-8">
          <TabsList className="bg-gray-900">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="logos">Logo Submissions</TabsTrigger>
            <TabsTrigger value="database">Database Explorer</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-black text-white border-gray-700">
                <CardHeader>
                  <CardTitle>Total Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold">{users?.length || 0}</div>
                </CardContent>
              </Card>
              
              <Card className="bg-black text-white border-gray-700">
                <CardHeader>
                  <CardTitle>Active Users (24h)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold">{dailyStats?.activeUsers || 0}</div>
                </CardContent>
              </Card>
              
              <Card className="bg-black text-white border-gray-700">
                <CardHeader>
                  <CardTitle>Logos Generated (24h)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold">{dailyStats?.totalLogos || 0}</div>
                </CardContent>
              </Card>
            </div>
            
            <Card className="h-[400px] p-4">
              <CardHeader>
                <CardTitle>Logo Generation Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={recentLogos?.map(logo => ({
                    timestamp: format(new Date(logo.timestamp), 'MM/dd HH:mm'),
                    value: 1
                  })) || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <RechartsTooltip />
                    <Line type="monotone" dataKey="value" stroke="#8884d8" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="users">
            <Card className="bg-black text-white border-gray-700">
              <CardHeader>
                <CardTitle>Users</CardTitle>
              </CardHeader>
              <CardContent>
                {usersError ? (
                  <div className="bg-red-100 text-red-800 p-4 rounded">
                    Error loading users. Please check the console for more details.
                  </div>
                ) : !users ? (
                  <div className="p-4 text-center">
                    Loading users...
                  </div>
                ) : users.length === 0 ? (
                  <div className="p-4 text-center">
                    No users found
                  </div>
                ) : (
                  <Table className="border-gray-800">
                    <TableHeader className="bg-gray-900">
                      <TableRow>
                        <TableHead className="text-white">Email</TableHead>
                        <TableHead className="text-white">Logos</TableHead>
                        <TableHead className="text-white">Last Active</TableHead>
                        <TableHead className="text-white">Last Company</TableHead>
                        <TableHead className="text-white">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow 
                          key={user.userId}
                          className={user.needsSync ? "bg-yellow-900 bg-opacity-40" : ""}
                        >
                          <TableCell className="font-medium">{user.email}</TableCell>
                          <TableCell>{user.totalLogosGenerated}</TableCell>
                          <TableCell>
                            {user.lastActive 
                              ? format(new Date(user.lastActive), 'MMM d, yyyy h:mm a') 
                              : 'Never'}
                          </TableCell>
                          <TableCell>{user.lastCompanyName}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleCreateSampleLogo(user.userId)}
                                disabled={sampleStatus.loading}
                              >
                                Sample Logo
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logos">
            <Card>
              <CardContent>
                {logosError ? (
                  <div className="bg-red-100 text-red-800 p-4 rounded">
                    Error loading logos. Please check the console for more details.
                  </div>
                ) : !recentLogos ? (
                  <div className="p-4 text-center">
                    Loading logos...
                  </div>
                ) : recentLogos.length === 0 ? (
                  <div className="p-4 text-center">
                    No logos found
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {recentLogos.map((logo: any) => (
                      <Card key={String(logo._id)}>
                        <CardHeader>
                          <CardTitle className="text-sm">
                            {logo.companyName}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <p className="text-sm text-gray-500">
                              Style: {logo.style}
                            </p>
                            <p className="text-sm text-gray-500">
                              Layout: {logo.layout}
                            </p>
                            <div className="grid gap-2 grid-cols-2">
                              {logo.images && logo.images.map((image: string, idx: number) => (
                                <div key={idx} className="relative aspect-square">
                                  <Image
                                    src={image}
                                    alt={`Logo ${idx + 1}`}
                                    fill
                                    className="object-contain"
                                  />
                                </div>
                              ))}
                            </div>
                            <p className="text-xs text-gray-400">
                              {format(new Date(logo.timestamp), "MM/dd/yyyy HH:mm")}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="database" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Database Explorer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-4 flex-wrap">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Table
                    </label>
                    <select
                      value={selectedTable}
                      onChange={(e) => setSelectedTable(e.target.value)}
                      className="px-3 py-2 border rounded w-40"
                    >
                      {tables?.map((table) => (
                        <option key={table} value={table}>
                          {table}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Limit
                    </label>
                    <Input
                      type="number"
                      value={recordLimit}
                      onChange={(e) => setRecordLimit(parseInt(e.target.value) || 100)}
                      className="w-24"
                      min={1}
                      max={500}
                    />
                  </div>
                </div>
                
                {tableData && tableData.length > 0 ? (
                  <div className="overflow-auto max-h-[60vh]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>#</TableHead>
                          <TableHead>ID</TableHead>
                          {columns.map((column) => (
                            <TableHead key={column}>{column}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tableData.map((record: any, index: number) => (
                          <TableRow key={String(record._id)}>
                            <TableCell className="font-mono">{index + 1}</TableCell>
                            <TableCell className="font-mono text-xs max-w-[200px] truncate">
                              {String(record._id)}
                            </TableCell>
                            {columns.map((column) => (
                              <TableCell key={column} className="max-w-[250px] truncate">
                                {renderValue(record[column as keyof typeof record])}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    {!selectedTable 
                      ? "Select a table to view data" 
                      : `No data found in table '${selectedTable}'`}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <ConvexErrorBoundary>
      <AdminDashboardContent />
    </ConvexErrorBoundary>
  );
} 