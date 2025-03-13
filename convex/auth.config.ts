export default {
  providers: [
    {
      // During development, if env var isn't available, use the production domain
      domain: process.env.NEXT_PUBLIC_CLERK_DOMAIN || "verified-flea-40.clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
  // Add roles configuration
  roles: ["admin"],
}; 