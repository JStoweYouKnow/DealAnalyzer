import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initFirebase } from "./lib/firebase";

// Initialize Firebase only when a VITE_FIREBASE_API_KEY is provided.
// This keeps the bundle small when Firebase isn't used.
if (import.meta.env.VITE_FIREBASE_API_KEY) {
	initFirebase();
}

createRoot(document.getElementById("root")!).render(<App />);
