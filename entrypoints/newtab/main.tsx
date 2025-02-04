import React from "react";
import ReactDOM from "react-dom/client";
import "../style.css";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <main className="relative min-h-screen">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/90 to-background" />
        <div
          className="absolute right-0 top-0 h-[500px] w-[500px] bg-blue-500/10 blur-[100px] animate-move-gradient"
          style={{
            animation: "moveGradient1 15s ease infinite",
          }}
        />
        <div
          className="absolute bottom-0 left-0 h-[500px] w-[500px] bg-purple-500/10 blur-[100px] animate-move-gradient-reverse"
          style={{
            animation: "moveGradient2 20s ease infinite",
          }}
        />
      </div>
      <div className="relative z-10 p-8">
        <App />
      </div>
    </main>
  </React.StrictMode>
);
