import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";
import { clearGameSession, getCurrentSession } from "./utils/test-utils";

// Add test utilities to window for easy access in browser console
if (import.meta.env.DEV) {
  (window as any).clearGameSession = clearGameSession;
  (window as any).getCurrentSession = getCurrentSession;
  console.log("🧪 Test utilities available:");
  console.log("  - clearGameSession() - clears current session");
  console.log("  - getCurrentSession() - shows current session");
}

createRoot(document.getElementById("root")!).render(<App />);
