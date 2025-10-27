export default {
  providers: [
    {
      domain: process.env.CLERK_FRONTEND_API_URL || 'large-wolf-5.clerk.accounts.dev',
      applicationID: 'convex',
    },
  ],
}
