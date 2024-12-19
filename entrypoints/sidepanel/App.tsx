import { decryptData } from "@/lib/cryptoUtils";
import { useState, useEffect } from "react";
import logo from "/icon/128.png";
import ActivateLicense from "@/components/ActivateLicense";

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
    <div className="app-container p-2 bg-gray-100 min-h-screen flex flex-col items-center justify-center">
      <div className="flex items-center ">
        <img src={logo} alt="QuickPeek Logo" className="app-logo w-10 h-10" />
        <h1 className="app-title text-4xl font-bold text-[#32CD32] -ml-1">
          uickPeek
        </h1>
      </div>

      <div className="">
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
      </div>
      <ActivateLicense />
      <SearchEngineSelector />
      <div className="info mt-1">
        <h3 className="text-xl font-semibold mb-1">Installation Time</h3>
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
  );
}

export default App;
