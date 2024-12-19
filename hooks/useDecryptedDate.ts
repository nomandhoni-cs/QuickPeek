import { decryptData } from "@/lib/cryptoUtils";
import { useEffect, useState } from "react";

interface DecryptedData {
  decryptedDate: string | null;
}

const useDecryptedDate = (): DecryptedData => {
  const [decryptedDate, setDecryptedDate] = useState<string | null>(null);

  useEffect(() => {
    const fetchDecryptedDate = async () => {
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
          console.log(decryptedInstallTime, "decryptedInstallTime");
          setDecryptedDate(decryptedInstallTime);
        }
      } catch (error) {
        console.error("Error fetching or saving install date:", error);
      }
    };

    fetchDecryptedDate();
  }, []);
  return { decryptedDate };
};

export default useDecryptedDate;
