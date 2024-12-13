import { useState } from "react";
import reactLogo from "@/assets/react.svg";
import wxtLogo from "/wxt.svg";
import "./App.css";

function App() {
  const [count, setCount] = useState(0);
  const handleSubmit = async (event) => {
    event.preventDefault();

    // Make sure browser API is available
    if (browser.tabs && typeof browser.tabs.create === "function") {
      try {
        const tab = await browser.tabs.create({ url: "https://blinkeye.app" });
        console.log("New tab created:", tab);
      } catch (error) {
        console.error("Error creating tab:", error);
      }
    } else {
      console.error("Tabs API is not available.");
    }
  };

  return (
    <>
      <div>
        <button onClick={handleSubmit}>Open new tab</button>
        <a href="https://wxt.dev" target="_blank">
          <img src={wxtLogo} className="logo" alt="WXT logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>WXT + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the WXT and React logos to learn more
      </p>
    </>
  );
}

export default App;
