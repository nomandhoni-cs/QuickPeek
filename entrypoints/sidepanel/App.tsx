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
    <div className="app-container p-4 bg-gray-100 min-h-screen flex flex-col items-center justify-center">
      <img
        src={logo}
        alt="QuickPeek Logo"
        className="app-logo w-24 h-24 mb-4"
      />
      <h1 className="app-title text-4xl font-bold text-[#32CD32] mb-8">
        QuickPeek
      </h1>

      <div className="card bg-white rounded-lg shadow-md p-6 w-full max-w-md">
        <p className="instruction text-center mb-4">
          Use{" "}
          <span className="highlight font-semibold text-[#32CD32]">
            CTRL + M
          </span>{" "}
          /{" "}
          <span className="highlight font-semibold text-[#32CD32]">
            Command + M
          </span>{" "}
          to launch the search
        </p>

        <div className="info mt-6">
          <h2 className="text-xl font-semibold mb-2">Installation Time</h2>
          <p className="text-gray-600">
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
      <SearchEngineSelector />
    </div>
  );
}

export default App;
