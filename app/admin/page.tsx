"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { AdminTest } from "./admin-test";

export default function AdminDashboard() {
  const [selectedTab, setSelectedTab] = useState("overview");
  
  // Simple queries without complex error handling
  const users = useQuery(api.admin.getAllUsers);
  const recentLogos = useQuery(api.admin.getRecentLogos, { limit: 50 });
  
  const formatTime = (timestamp: number | undefined) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto py-10 px-4">
        <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
        
        {/* Connection Test Component */}
        <div className="mb-8">
          <AdminTest />
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
          <TabsList className="bg-gray-900">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="logos">Recent Logos</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 rounded-lg bg-gray-800">
                    <h3 className="font-semibold text-gray-400">Total Users</h3>
                    <p className="text-3xl font-bold">{users?.length || 0}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-gray-800">
                    <h3 className="font-semibold text-gray-400">Recent Logos</h3>
                    <p className="text-3xl font-bold">{recentLogos?.length || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle>Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-800 hover:bg-gray-800">
                        <TableHead className="text-gray-400">Email</TableHead>
                        <TableHead className="text-gray-400">User ID</TableHead>
                        <TableHead className="text-gray-400">Total Logos</TableHead>
                        <TableHead className="text-gray-400">Last Active</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users?.map((user) => (
                        <TableRow key={user._id} className="hover:bg-gray-800">
                          <TableCell>{user.email || "N/A"}</TableCell>
                          <TableCell className="font-mono text-sm">{user.userId || "N/A"}</TableCell>
                          <TableCell>{user.totalLogosGenerated || 0}</TableCell>
                          <TableCell>{formatTime(user.lastActive)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logos">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle>Recent Logos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-800 hover:bg-gray-800">
                        <TableHead className="text-gray-400">Company</TableHead>
                        <TableHead className="text-gray-400">User ID</TableHead>
                        <TableHead className="text-gray-400">Style</TableHead>
                        <TableHead className="text-gray-400">Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentLogos?.map((logo) => (
                        <TableRow key={logo._id} className="hover:bg-gray-800">
                          <TableCell>{logo.companyName || "N/A"}</TableCell>
                          <TableCell className="font-mono text-sm">{logo.userId || "N/A"}</TableCell>
                          <TableCell>{logo.style || "N/A"}</TableCell>
                          <TableCell>{formatTime(logo.timestamp)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 