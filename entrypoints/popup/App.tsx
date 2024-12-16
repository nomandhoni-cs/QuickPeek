import { decryptData } from "@/lib/cryptoUtils";
import { useState, useEffect } from "react";
import logo from "/icon/128.png";

function App() {
  // const [nanoId, setNanoId] = useState<string | null>(null);
  const [installTimeValue, setInstallTimeValue] = useState<Date | null>(null);

  useEffect(() => {
    const fetchStorageData = async () => {
      try {
        // // Fetch Nano ID
        // const storedNanoId = await storage.getItem<string>("sync:nanoId");
        // setNanoId(storedNanoId || "No Nano ID found");

        // Fetch and decrypt installation time
        const encryptedInstallTimeString = await storage.getItem<string>(
          "sync:installDate"
        );
        console.log(encryptedInstallTimeString);
        if (encryptedInstallTimeString) {
          const decryptedInstallTime = await decryptData(
            encryptedInstallTimeString
          );
          console.log(decryptedInstallTime);
          const timestamp = parseInt(decryptedInstallTime);
          setInstallTimeValue(new Date(timestamp));
        } else {
          console.log("No install time found");
          setInstallTimeValue(null);
        }
      } catch (error) {
        console.error("Error fetching storage data:", error);
      }
    };

    fetchStorageData();
  }, []);

  return (
    <div className="app-container">
      <img src={logo} alt="QuickPeek Logo" className="app-logo" />
      <h1 className="app-title">QuickPeek</h1>

      <div className="card">
        <p className="instruction">
          Use <span className="highlight">CTRL + M</span> /{" "}
          <span className="highlight">Command + M</span> to launch the search
        </p>

        {/* <div className="info">
          <h2>Nano ID</h2>
          <p>{nanoId || "Loading..."}</p>
        </div> */}

        <div className="info">
          <h2>Installation Time</h2>
          <p>
            {installTimeValue
              ? installTimeValue.toLocaleString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "numeric",
                  minute: "numeric",
                  second: "numeric",
                  timeZoneName: "short",
                })
              : "No install time found"}
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
