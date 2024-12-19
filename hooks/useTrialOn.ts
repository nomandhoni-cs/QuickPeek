import { useState, useEffect } from "react";
import useDecryptedDate from "./useDecryptedDate";

export function useOnlineStatus(): {
  isTrialOn: boolean;
  daysRemaining: number | null;
} {
  const { decryptedDate } = useDecryptedDate();
  const [isTrialOn, setIsTrialOn] = useState<boolean>(false);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);

  useEffect(() => {
    const TRIAL_DAYS = 30;

    try {
      if (!decryptedDate) {
        setIsTrialOn(false);
        return;
      }

      const startDate = new Date(parseInt(decryptedDate));
      const currentDate = new Date();

      // Validate dates
      if (isNaN(startDate.getTime())) {
        console.error("Invalid start date");
        setIsTrialOn(false);
        return;
      }

      // Prevent future start dates
      if (startDate > currentDate) {
        console.error("Start date cannot be in the future");
        setIsTrialOn(false);
        return;
      }

      // Convert to UTC midnight to avoid time zone issues
      const startDateUTC = Date.UTC(
        startDate.getUTCFullYear(),
        startDate.getUTCMonth(),
        startDate.getUTCDate()
      );
      const currentDateUTC = Date.UTC(
        currentDate.getUTCFullYear(),
        currentDate.getUTCMonth(),
        currentDate.getUTCDate()
      );

      const diffTime = currentDateUTC - startDateUTC;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      const remaining = TRIAL_DAYS - diffDays;
      setDaysRemaining(remaining);
      setIsTrialOn(remaining > 0);
    } catch (error) {
      console.error("Error calculating trial status:", error);
      setIsTrialOn(false);
      setDaysRemaining(null);
    }
  }, [decryptedDate]);

  return { isTrialOn, daysRemaining };
}
