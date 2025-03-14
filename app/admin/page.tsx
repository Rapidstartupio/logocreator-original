"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Image from "next/image";
import { Card } from "../components/ui/card";
import { ScrollArea } from "../components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

interface UserStats {
  totalUsers: number;
  activeUsersToday: number;
  newUsersToday: number;
  totalLogosGenerated: number;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  totalLogosGenerated: number;
  credits: number;
  isAdmin: boolean;
  createdAt: number;
  lastActive: number | null;
}

interface Logo {
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
  userEmail: string;
}

interface AdminResponse {
  success: boolean;
  error?: string;
  stats?: UserStats;
  users?: User[];
}

interface LogoResponse {
  success: boolean;
  error?: string;
  data?: Logo[];
}

function ErrorDisplay({ error }: { error: string }) {
  return (
    <Card className="p-6 bg-red-900/20 border-red-500">
      <h3 className="text-lg font-semibold text-red-400">Error</h3>
      <p className="text-sm text-red-300">{error}</p>
    </Card>
  );
}

function LoadingDisplay() {
  return (
    <Card className="p-6">
      <p className="text-center">Loading...</p>
    </Card>
  );
}

export default function AdminPage() {
  const userStats = useQuery(api.admin.getUserStats) as AdminResponse;
  const recentLogos = useQuery(api.admin.getRecentLogos) as LogoResponse;

  // Handle loading states
  if (!userStats || !recentLogos) {
    return <LoadingDisplay />;
  }

  // Handle errors
  if (!userStats.success) {
    return <ErrorDisplay error={userStats.error || "Failed to load user stats"} />;
  }

  if (!recentLogos.success) {
    return <ErrorDisplay error={recentLogos.error || "Failed to load recent logos"} />;
  }

  // Ensure we have the required data
  if (!userStats.stats || !userStats.users || !recentLogos.data) {
    return <ErrorDisplay error="Missing required data" />;
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>
      
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="logos">Recent Logos</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-400">Total Users</h3>
              <p className="text-3xl font-bold">{userStats.stats.totalUsers}</p>
            </Card>
            
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-400">Active Today</h3>
              <p className="text-3xl font-bold">{userStats.stats.activeUsersToday}</p>
            </Card>
            
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-400">New Today</h3>
              <p className="text-3xl font-bold">{userStats.stats.newUsersToday}</p>
            </Card>
            
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-400">Total Logos</h3>
              <p className="text-3xl font-bold">{userStats.stats.totalLogosGenerated}</p>
            </Card>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card className="p-4">
            <h2 className="text-2xl font-semibold mb-4">User List</h2>
            <ScrollArea className="h-[600px] w-full rounded-md border p-4">
              <div className="space-y-4">
                {userStats.users.map((user) => (
                  <Card key={user.id} className="p-4">
                    <div className="grid grid-cols-2 gap-4">
                      {/* User Basic Info */}
                      <div>
                        <h3 className="text-lg font-semibold">{user.email}</h3>
                        <p className="text-sm text-gray-400">
                          {user.firstName ? `Business Type: ${user.firstName}` : 'No business type'}
                        </p>
                        <p className="text-sm">ID: {user.id}</p>
                      </div>

                      {/* User Stats */}
                      <div className="text-sm grid grid-cols-2 gap-2">
                        <div>Logos Generated:</div>
                        <div>{user.totalLogosGenerated}</div>
                        <div>Credits:</div>
                        <div>{user.credits}</div>
                        <div>Admin:</div>
                        <div>{user.isAdmin ? "Yes" : "No"}</div>
                        <div>Created:</div>
                        <div>{new Date(user.createdAt).toLocaleDateString()}</div>
                        <div>Last Active:</div>
                        <div>
                          {user.lastActive
                            ? new Date(user.lastActive).toLocaleString()
                            : "Never"}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </TabsContent>

        {/* Logos Tab */}
        <TabsContent value="logos" className="space-y-4">
          <Card className="p-4">
            <h2 className="text-2xl font-semibold mb-4">Recent Logos</h2>
            <ScrollArea className="h-[600px] w-full rounded-md border p-4">
              <div className="space-y-8">
                {recentLogos.data.map((logo) => (
                  <Card key={logo.id} className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Logo Preview */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">{logo.companyName}</h3>
                        {logo.images && logo.images.length > 0 && (
                          <div className="relative w-full aspect-square">
                            <Image
                              src={logo.images[0]}
                              alt={`Logo for ${logo.companyName}`}
                              fill
                              className="object-contain"
                            />
                          </div>
                        )}
                      </div>

                      {/* Logo Details */}
                      <div className="text-sm grid grid-cols-2 gap-2">
                        <div>Created By:</div>
                        <div>{logo.userEmail}</div>
                        <div>Status:</div>
                        <div>{logo.status}</div>
                        <div>Style:</div>
                        <div>{logo.style}</div>
                        <div>Layout:</div>
                        <div>{logo.layout}</div>
                        <div>Business Type:</div>
                        <div>{logo.businessType || "Not specified"}</div>
                        <div>Created:</div>
                        <div>{new Date(logo.timestamp).toLocaleString()}</div>
                        <div>Generation Time:</div>
                        <div>{logo.generationTime ? `${logo.generationTime}ms` : "Unknown"}</div>
                        <div>Model:</div>
                        <div>{logo.modelUsed || "Not specified"}</div>
                      </div>
                    </div>

                    {/* Additional Details */}
                    {(logo.prompt || logo.additionalInfo) && (
                      <div className="mt-4 pt-4 border-t border-gray-800">
                        {logo.prompt && (
                          <div className="mb-2">
                            <div className="font-semibold">Prompt:</div>
                            <div className="text-sm text-gray-400">{logo.prompt}</div>
                          </div>
                        )}
                        {logo.additionalInfo && (
                          <div>
                            <div className="font-semibold">Notes:</div>
                            <div className="text-sm text-gray-400">{logo.additionalInfo}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}