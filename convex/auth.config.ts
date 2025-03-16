export default {
  providers: [
    {
      domain: "verified-flea-40.clerk.accounts.dev",
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