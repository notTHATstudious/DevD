import { createRoot } from "react-dom/client";
import { applyPwaStandaloneMode } from "./lib/pwaStandalone.ts";
import App from "./App.tsx";
import "./index.css";

applyPwaStandaloneMode();

createRoot(document.getElementById("root")!).render(<App />);
