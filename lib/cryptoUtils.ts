// Function to retrieve the password (unique_nano_id) from the database
const getPasswordFromDatabase = async (): Promise<string> => {
  const nanoId = await storage.getItem<string>("sync:nanoId");
  if (!nanoId) {
    throw new Error("Password (Nano ID) not found");
  }
  return nanoId;
};

// Encrypt function that automatically fetches the password (unique_nano_id)
export const encryptData = async (
  plainText: string
): Promise<{ iv: number[]; data: number[] }> => {
  try {
    const password = await getPasswordFromDatabase();

    const encoder = new TextEncoder();
    const encodedPassword = encoder.encode(password);

    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encodedPassword,
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );

    const key = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: encoder.encode("unique_salt"),
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encodedText = encoder.encode(plainText);

    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      key,
      encodedText
    );

    return {
      iv: Array.from(iv),
      data: Array.from(new Uint8Array(encryptedBuffer)),
    };
  } catch (error) {
    console.error("Encryption error:", error);
    throw error;
  }
};

// Decrypt function that automatically fetches the password (unique_nano_id)
export const decryptData = async (encryptedText: string): Promise<string> => {
  try {
    const password = await getPasswordFromDatabase();
    const { iv, data } = JSON.parse(encryptedText);

    const encoder = new TextEncoder();
    const encodedPassword = encoder.encode(password);

    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encodedPassword,
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );

    const key = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: encoder.encode("unique_salt"),
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"]
    );

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: new Uint8Array(iv) },
      key,
      new Uint8Array(data).buffer
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch (error) {
    console.error("Decryption error:", error);
    throw error;
  }
};
