import React from "react";
import ReactDOM from "react-dom/client";
import "../style.css";
import App from "./App";
import NewTabSetting from "@/components/NewTabSetting";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <main className="relative min-h-screen bg-background">
      {/* Apply bg-background to main */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/90 to-background" />
        <div
          className="absolute right-0 top-0 h-[500px] w-[500px] bg-blue-500/10 blur-[150px] animate-move-gradient" /* Increased blur */
          style={{
            animation: "moveGradient1 15s ease infinite",
          }}
        />
        <div
          className="absolute bottom-0 left-0 h-[500px] w-[500px] bg-purple-500/10 blur-[150px] animate-move-gradient-reverse" /* Increased blur */
          style={{
            animation: "moveGradient2 20s ease infinite",
          }}
        />
        <div
          className="absolute top-1/4 left-1/4 h-[300px] w-[300px] bg-green-500/5 blur-[100px] animate-move-gradient"
          style={{
            animation: "moveGradient1 25s ease infinite",
            animationDelay: "-7s",
          }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 h-[400px] w-[400px] bg-orange-500/5 blur-[120px] animate-move-gradient-reverse"
          style={{
            animation: "moveGradient2 30s ease infinite",
            animationDelay: "-12s",
          }}
        />
      </div>
      <div className="relative z-10 p-8 glassmorphism-dark">
        <App />
      </div>
      <div className="absolute bottom-4 right-4 z-20 glassmorphism-dark">
        <NewTabSetting />
      </div>
    </main>
  </React.StrictMode>
);
