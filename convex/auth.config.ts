const authConfig = {
  providers: [
    {
      domain: process.env.NEXT_PUBLIC_CLERK_DOMAIN || "https://verified-flea-40.clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
  // Add roles configuration with proper access control
  roles: ["admin"],
  // Configure admin access
  rules: [
    {
      resource: "admin",
      role: "admin",
      public: false,
    },
  ],
};

export default authConfig;