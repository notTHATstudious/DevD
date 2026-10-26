import { createRoot } from "react-dom/client";
import { applyPwaStandaloneMode } from "./lib/pwaStandalone.ts";
import { removeKeys } from "./lib/localStore.ts";
import App from "./App.tsx";
import "./index.css";

applyPwaStandaloneMode();

// Leftovers from the removed local login (v1–v3.1). Bookmarks and read history
// are migrated by their stores on first use.
removeKeys(["dailyd_users", "dailyd_session", "dailyd_tag", "dailyd_session_at"]);

createRoot(document.getElementById("root")!).render(<App />);
