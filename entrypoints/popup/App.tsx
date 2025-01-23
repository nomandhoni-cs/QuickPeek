import React from "react";
import {
  ClerkProvider,
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/chrome-extension";

const PUBLISHABLE_KEY = `pk_test_YnJpZWYtc2xvdGgtNDAuY2xlcmsuYWNjb3VudHMuZGV2JA`;

if (!PUBLISHABLE_KEY) {
  throw new Error(
    "Please add the PLASMO_PUBLIC_CLERK_PUBLISHABLE_KEY to the .env.development file"
  );
}

const EXTENSION_URL = `chrome-extension://lcpkmppfkkdldambbnakpapngjabiaml`;

// Custom function to execute after login
function handleLoginSuccess() {
  console.log("Login was successful!");
  // Add additional functionality here
}

function App() {
  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      afterSignOutUrl={`${EXTENSION_URL}/popup.html`}
      signInFallbackRedirectUrl={`${EXTENSION_URL}/popup.html`}
      signUpFallbackRedirectUrl={`${EXTENSION_URL}/popup.html`}
      signInForceRedirectUrl={`${EXTENSION_URL}/popup.html`}
    >
      <div className="plasmo-flex plasmo-items-center plasmo-justify-center plasmo-h-[600px] plasmo-w-[800px] plasmo-flex-col">
        <header className="plasmo-w-full">
          <SignedOut>
            <SignInButton mode="redirect" />
          </SignedOut>
          <SignedIn>
            <SignedInComponent onLogin={handleLoginSuccess} />
          </SignedIn>
        </header>
      </div>
    </ClerkProvider>
  );
}

// A component that triggers the `onLogin` function when rendered
function SignedInComponent({ onLogin }: { onLogin: () => void }) {
  React.useEffect(() => {
    onLogin(); // Trigger the login success function when the component mounts
  }, [onLogin]);

  return <UserButton />;
}

export default App;
