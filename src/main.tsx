import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// Plus Jakarta Sans — body text
import "@fontsource/plus-jakarta-sans/400.css";  // base body
import "@fontsource/plus-jakarta-sans/500.css";  // font-medium
import "@fontsource/plus-jakarta-sans/600.css";  // font-semibold
import "@fontsource/plus-jakarta-sans/700.css";  // font-bold
import "@fontsource/plus-jakarta-sans/800.css";  // font-extrabold, font-black fallback
// Space Grotesk — mono/numbers (only bold weights used)
import "@fontsource/space-grotesk/600.css";      // font-semibold
import "@fontsource/space-grotesk/700.css";      // font-bold, font-black fallback
import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
