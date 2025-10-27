import { ConvexReactClient } from "convex/react";
import { api } from "../../convex/_generated/api";

// Initialize Convex client for React
const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export { convex, api };
