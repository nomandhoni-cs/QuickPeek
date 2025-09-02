import React from "react";
import ReactDOM from "react-dom/client";
import "../style.css";
import App from "./App";
import TaskManager from "@/components/TaskManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <div className="flex justify-center">
      <Tabs defaultValue="taskmanager" >
        <TabsList className="grid w-full grid-cols-2 mt-1">
          <TabsTrigger value="taskmanager">New Task Manager</TabsTrigger>
          <TabsTrigger value="app">Settings</TabsTrigger>
        </TabsList>

        {/* Content for the New Task Manager Tab */}
        <TabsContent value="taskmanager">
          <div className="pb-1">
            <TaskManager />
          </div>
        </TabsContent>

        {/* Content for the Old App Tab */}
        <TabsContent value="app">
          <div>
            <App />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  </React.StrictMode>
);
