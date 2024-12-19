import { useEffect, useState } from "react";
import { storage } from "wxt/storage";
import { decryptData } from "../lib/cryptoUtils";

interface LicenseData {
  license_key: string;
  status: string;
  saved_date: string;
}

interface UseLicenseKeyReturn {
  licenseData: LicenseData | null;
  loading: boolean;
  error: Error | null;
  refreshLicenseData: () => Promise<void>;
}

type LicenseStorageData = {
  license_key: string;
  status: string;
  saved_date: string;
};

const licenseStorage = storage.defineItem<LicenseStorageData | null>(
  "sync:licenseData",
  {
    fallback: null,
    version: 1,
  }
);

export function useLicenseKey(): UseLicenseKeyReturn {
  const [licenseData, setLicenseData] = useState<LicenseData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchLicenseData = async () => {
    try {
      setLoading(true);
      setError(null);

      const encryptedData = await licenseStorage.getValue();
      console.log(encryptedData);

      if (encryptedData) {
        const decryptedData: LicenseData = {
          license_key: await decryptData(encryptedData.license_key),
          status: await decryptData(encryptedData.status),
          saved_date: await decryptData(encryptedData.saved_date),
        };
        console.log(decryptedData);
        setLicenseData(decryptedData);
      } else {
        setLicenseData(null);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to fetch license data")
      );
      console.error("Failed to fetch license data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLicenseData();

    // Set up storage watcher
    const unwatch = licenseStorage.watch(() => {
      fetchLicenseData();
    });

    return () => unwatch();
  }, []);

  return {
    licenseData,
    loading,
    error,
    refreshLicenseData: fetchLicenseData,
  };
}
