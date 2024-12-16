import { useState, useEffect } from "react";
import { decryptData } from "@/lib/cryptoUtils";

const TrialRemaining = () => {
  const [installTimeValue, setInstallTimeValue] = useState<Date | null>(null);
  const [trialRemaining, setTrialRemaining] = useState<string | null>(null);
  const trialPeriod = 30; // 30-day trial

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
    <div className="trial-container">
      {installTimeValue ? (
        <span className="trial-info text-white">
          Trial Remaining: {trialRemaining}
        </span>
      ) : (
        <span className="trial-info text-white animate-pulse">
          Loading trial information...
        </span>
      )}
    </div>
  );
};

export default TrialRemaining;
