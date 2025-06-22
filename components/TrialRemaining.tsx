import { useState, useEffect } from "react";
import { decryptData } from "@/lib/cryptoUtils";
import { Button } from "./ui/button";
import { FireIcon } from "@heroicons/react/24/solid";

const TrialRemaining = () => {
  const [installTimeValue, setInstallTimeValue] = useState<Date | null>(null);
  const [trialRemaining, setTrialRemaining] = useState<string | null>(null);
  const trialPeriod = 7; // 7-day trial

  useEffect(() => {
    const fetchInstallTime = async () => {
      try {
        // Fetch and decrypt the installation date from storage
        const encryptedInstallTimeString = await storage.getItem<string>(
          "sync:installDate"
        );

        if (encryptedInstallTimeString) {
          // Decrypt and parse the installation date
          const decryptedInstallTime = await decryptData(
            encryptedInstallTimeString
          );
          const timestamp = parseInt(decryptedInstallTime);
          const installDate = new Date(timestamp);
          setInstallTimeValue(installDate);

          // Calculate the remaining trial period
          calculateTrialRemaining(installDate);
        } else {
          // If no installation time is found, initialize with current date
          const currentInstallDate = new Date();
          setInstallTimeValue(currentInstallDate);

          // Start trial calculation
          calculateTrialRemaining(currentInstallDate);
        }
      } catch (error) {
        console.error("Error fetching or saving install date:", error);
      }
    };

    // Calculate the remaining trial days
    const calculateTrialRemaining = (installDate: Date) => {
      const currentDate = new Date();
      const diffTime = currentDate.getTime() - installDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 3600 * 24)); // Convert ms to days

      const daysRemaining = trialPeriod - diffDays;

      if (daysRemaining > 0) {
        setTrialRemaining(`${daysRemaining} days`);
      } else {
        setTrialRemaining("Your trial period has expired.");
      }
    };

    fetchInstallTime();
  }, []);

  return (
    <div className="mb-2 px-1">
      {installTimeValue ? (
        <div className="flex items-center justify-between">
          <span className=" text-white font-semibold">
            Trial Remaining: {trialRemaining}
          </span>
          <span className="flex items-center justify-center text-white">
            You are using a free version
            <Button
              className="bg-yellow-500 text-black ml-2 hover:bg-yellow-600"
              asChild
            >
              <a href="https://quickpeek.vercel.app/pricing" target="_blank">
                <FireIcon className="w-4 h-4" />
                Upgrade
              </a>
            </Button>
          </span>
        </div>
      ) : (
        <span className="trial-info text-white animate-pulse">
          Loading trial information...
        </span>
      )}
    </div>
  );
};

export default TrialRemaining;
