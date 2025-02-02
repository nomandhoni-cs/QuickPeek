import {
  ClerkProvider,
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
  useAuth,
} from "@clerk/chrome-extension";

const PUBLISHABLE_KEY = `pk_test_YnJpZWYtc2xvdGgtNDAuY2xlcmsuYWNjb3VudHMuZGV2JA`;

const EXTENSION_URL = chrome.runtime.getURL(".");

if (!PUBLISHABLE_KEY) {
  throw new Error(
    "Please add the PLASMO_PUBLIC_CLERK_PUBLISHABLE_KEY to the .env.development file"
  );
}

function IndexPopup() {
  const { isSignedIn, isLoaded } = useAuth();

  const handleSignInComplete = () => {
    // Add your custom logic here after successful sign in
    console.log("Successfully signed in!");
    // Example: you could navigate to a different page
    // Example: you could fetch user data
    // Example: you could initialize your app state
  };

  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      afterSignOutUrl={`${EXTENSION_URL}/popup.html`}
      signInFallbackRedirectUrl={`${EXTENSION_URL}/popup.html`}
      signUpFallbackRedirectUrl={`${EXTENSION_URL}/popup.html`}
    >
      <div className="plasmo-flex plasmo-items-center plasmo-justify-center plasmo-h-[600px] plasmo-w-[800px] plasmo-flex-col">
        <header className="plasmo-w-full">
          <SignedOut>
            <SignInButton
              mode="modal"
              children
              // Only use the props that are actually available
              onClick={() => {
                // You can handle pre-sign-in logic here
                console.log("Opening sign-in modal");
              }}
            />
          </SignedOut>
          <SignedIn>
            <UserButton afterSignOutUrl={`${EXTENSION_URL}/popup.html`} />
          </SignedIn>
        </header>

        <main className="plasmo-grow">
          {/* Example of conditional rendering based on auth state */}
          {isLoaded && isSignedIn ? (
            <>
              <p>Welcome back!</p>
              {/* Add any other authenticated-only components here */}
            </>
          ) : (
            // Optional: Show something else for non-authenticated users
            <div>Please sign in to access the content</div>
          )}
        </main>
      </div>
    </ClerkProvider>
  );
}

export default IndexPopup;
