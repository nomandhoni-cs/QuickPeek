import React from "react";
import ReactDOM from "react-dom/client";
import "../style.css";
import App from "./App";
import NewTabSetting from "@/components/NewTabSetting";
import TaskManager from "@/components/TaskManager";
import gradientGL from 'gradient-gl'
gradientGL('a2.ec55')
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <main className="relative min-h-screen backdrop-blur-[9px] backdrop-saturate-[187%] bg-[#ffffff] bg-opacity-10">
        <App />
      <div className="absolute top-6 right-4 z-20">
        <TaskManager />
      </div>
      <div className="absolute bottom-4 right-4 z-20">
        <NewTabSetting />
      </div>
    </main>
  </React.StrictMode>
);
