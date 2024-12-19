import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState } from "react";
import { useLicenseKey } from "@/hooks/useLicenseKey";

import { storage } from "wxt/storage";
import { CheckCircleIcon, ArrowPathIcon } from "@heroicons/react/24/solid";
import { encryptData } from "@/lib/cryptoUtils";
import { generatePhrase } from "@/lib/namegenerator";

const handshakePassword = import.meta.env.VITE_HANDSHAKE_PASSWORD;

// Add this type definition
type LicenseStorageData = {
  license_key: string;
  status: string;
  activation_limit: string;
  activation_usage: string;
  created_at: string;
  expires_at: string;
  test_mode: string;
  instance_name: string;
  store_id: string;
  order_id: string;
  order_item_id: string;
  variant_name: string;
  product_name: string;
  customer_name: string;
  customer_email: string;
  saved_date: string;
};

// Update storage definition
const licenseStorage = storage.defineItem<LicenseStorageData | null>(
  "sync:licenseData",
  {
    fallback: null,
    version: 1,
  }
);

async function storeLicenseData(data: any) {
  try {
    const encryptedData = {
      license_key: JSON.stringify(await encryptData(data.license_key.key)),
      status: JSON.stringify(await encryptData(data.license_key.status)),
      activation_limit: JSON.stringify(
        await encryptData(data.license_key.activation_limit)
      ),
      activation_usage: JSON.stringify(
        await encryptData(data.license_key.activation_usage)
      ),
      created_at: JSON.stringify(
        await encryptData(data.license_key.created_at)
      ),
      expires_at: JSON.stringify(
        await encryptData(data.license_key.expires_at)
      ),
      test_mode: JSON.stringify(await encryptData(data.license_key.test_mode)),
      instance_name: JSON.stringify(
        await encryptData(data.instance?.name || null)
      ),
      store_id: JSON.stringify(await encryptData(data.meta.store_id)),
      order_id: JSON.stringify(await encryptData(data.meta.order_id)),
      order_item_id: JSON.stringify(await encryptData(data.meta.order_item_id)),
      variant_name: JSON.stringify(await encryptData(data.meta.variant_name)),
      product_name: JSON.stringify(await encryptData(data.meta.product_name)),
      customer_name: JSON.stringify(await encryptData(data.meta.customer_name)),
      customer_email: JSON.stringify(
        await encryptData(data.meta.customer_email)
      ),
      saved_date: JSON.stringify(
        await encryptData(new Date().toISOString().split("T")[0])
      ),
    };

    await licenseStorage.setValue(encryptedData);
    console.log("License data saved successfully");
  } catch (error) {
    console.error("Error storing license data:", error);
    throw new Error("Failed to store license data");
  }
}

const ActivateLicense = () => {
  const [activationKey, setActivationKey] = useState("");
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState({
    activation: false,
    validation: false,
  });
  const handleActivate = async (e: React.FormEvent) => {
    const instanceName = generatePhrase();
    e.preventDefault();

    if (!activationKey.trim()) {
      alert("Please enter a license key");
      return;
    }

    setLoading((prev) => ({ ...prev, activation: true }));

    try {
      const response = await fetch(
        "https://blinkeye.vercel.app/api/activatelicense",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // Add any additional headers if needed
          },
          body: JSON.stringify({
            license_key: activationKey,
            instance_name: userName ? userName : instanceName,
            handshake_password: handshakePassword,
          }),
        }
      );

      const data = await response.json();
      console.log(data);

      if (!response.ok) {
        throw new Error(`Error: ${data.message || "Unknown error"}`);
      }

      // Check if store_id matches the required values
      if (data.meta?.store_id === 134128 || data.meta?.store_id === 132851) {
        // Store the license data
        await storeLicenseData(data);
        console.log("License data stored successfully");

        // Update the licenseKey state
        refreshLicenseData();

        // toast.success("License activated successfully!", {
        //   duration: 2000,
        //   position: "bottom-right",
        // });
        setActivationKey(""); // Clear input field
        setUserName(""); // Clear input field

        // Reload the page after a delay
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        console.log(
          "Store ID does not match required values. License data not stored."
        );
      }
    } catch (error) {
      console.error("Activation error:", error);
      //   toast.error("Failed to activate license. Please try again.", {
      //     duration: 2000,
      //     position: "bottom-right",
      //   });
    } finally {
      setLoading((prev) => ({ ...prev, activation: false }));
    }
  };
  const { licenseData, refreshLicenseData } = useLicenseKey();
  // Helper function to mask the license key
  const maskLicenseKey = (licenseKey: string): string => {
    if (!licenseKey) return "No license found"; // Handle empty or undefined keys
    // Split the license key into segments
    const segments = licenseKey.split("-");
    // Mask the middle segments
    return segments
      .map((segment, index) => (index >= 1 && index <= 3 ? "XXXX" : segment))
      .join("-");
  };

  // Function to handle copy to clipboard
  const handleCopy = async (licenseKey: string) => {
    if (licenseKey) {
      try {
        await navigator.clipboard.writeText(licenseKey);
      } catch (err) {
        console.error("Failed to copy text: ", err);
        // toast.error("Failed to copy license key to clipboard", {
        //   duration: 2000,
        //   position: "bottom-right",
        // });
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* License Status Card */}
      <div className="rounded-lg border p-2">
        <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
          <div className="flex items-center space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <p
                    className="font-medium text-xs sm:text-base cursor-pointer hover:opacity-75 transition-opacity"
                    onClick={() => handleCopy(licenseData?.license_key || "")}
                  >
                    {licenseData?.license_key
                      ? maskLicenseKey(licenseData.license_key)
                      : "No license found"}
                  </p>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Click to copy</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div>
            {licenseData?.status === "active" ? (
              <div className="inline-flex items-center space-x-2 border border-green-600 text-green-700 px-3 py-1 rounded-full">
                <CheckCircleIcon className="w-4 h-4" />
                <span className="text-xs font-medium">
                  {licenseData?.status.toUpperCase()}
                </span>
              </div>
            ) : licenseData?.status === "disabled" ||
              licenseData?.status === "inactive" ? (
              <div className="text-red-600 text-sm font-medium">
                {licenseData?.status.toUpperCase()}
              </div>
            ) : (
              <div className="text-gray-500 text-sm">
                Checking license status...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Activation Form */}
      <form className="rounded-lg border p-4" onSubmit={handleActivate}>
        <div className="space-y-4">
          <div>
            <Label htmlFor="activationKey" className="text-sm font-medium">
              License Key
            </Label>
            <Input
              type="text"
              id="activationKey"
              value={activationKey}
              onChange={(e) => setActivationKey(e.target.value)}
              placeholder="Enter your license key"
              disabled={loading.activation}
              className="mt-1 text-sm"
            />
          </div>

          <div>
            <Label htmlFor="userName" className="text-sm font-medium">
              Your Name (Optional)
            </Label>
            <Input
              type="text"
              id="userName"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter your name"
              disabled={loading.activation}
              className="mt-1 text-sm"
            />
          </div>

          <Button
            type="submit"
            disabled={loading.activation}
            className="w-full"
          >
            {loading.activation && (
              <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
            )}
            {loading.activation ? "Activating..." : "Activate License"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ActivateLicense;
