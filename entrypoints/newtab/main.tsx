// main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import "../style.css";
import App from "./App";
import NewTabSetting from "@/components/NewTabSetting";
import LayoutWrapper from "@/components/LayoutWrapper";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <LayoutWrapper>
      <App />
      <div className="fixed bottom-4 right-4 z-20">
        <NewTabSetting />
      </div>
    </LayoutWrapper>
  </React.StrictMode>
);