import { nanoid } from "nanoid";
import { storage } from "wxt/storage";
import { encryptData } from "./cryptoUtils";

// Utility function to define storage items with default initialization
export const defineStorageItem = <T>(
  key:
    | `local:${string}`
    | `session:${string}`
    | `sync:${string}`
    | `managed:${string}`,
  initFunction: () => T | Promise<T>
) => {
  return storage.defineItem<T>(key, {
    init: initFunction,
  });
};

// Define the storage item for Nano ID
export const installNanoId = defineStorageItem<string>("sync:nanoId", () =>
  nanoid()
);

// Function to initialize and encrypt the install date
export const setEncryptedInstallDate = async (): Promise<void> => {
  const existingDate = await storage.getItem<{ iv: number[]; data: number[] }>(
    "sync:installDate"
  );
  if (!existingDate) {
    const currentInstallDate = Date.now().toString();
    const encryptedDate = await encryptData(currentInstallDate);
    await storage.setItem("sync:installDate", encryptedDate);
    console.log("Encrypted installation date set:", encryptedDate);
  }
};
