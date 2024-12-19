import { useState, useEffect } from "react";
import { useOnlineStatus } from "../hooks/useTrialOn";
import { useLicenseKey } from "../hooks/useLicenseKey";

export const usePremiumFeatures = () => {
  const { isTrialOn } = useOnlineStatus();
  const { licenseData } = useLicenseKey();
  const [canAccessPremiumFeatures, setCanAccessPremiumFeatures] =
    useState(false);
  const [isPaidUser, setIsPaidUser] = useState(false);

  useEffect(() => {
    const paidUser = licenseData?.status === "active";
    setIsPaidUser(paidUser);
    setCanAccessPremiumFeatures(paidUser || isTrialOn);
  }, [licenseData, isTrialOn]);

  return {
    canAccessPremiumFeatures,
    isTrialOn,
    isPaidUser,
  };
};
