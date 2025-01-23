import * as React from "react";

export default function NewTab() {
  const [token, setToken] = React.useState<string | null>(null);

  const getToken = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    // Trigger the background service worker to get the token
    // and set the token in the state
    browser.runtime.sendMessage({ greeting: "get-token" }, (response) => {
      console.log(response);
      setToken(response.token.createdAt);
    });
  };

  return (
    <div>
      <p>Clerk Background Worker Demo</p>
      <div className="App">
        <p>
          This new tab simulates a content page where you might want to access
          user information, or make a request to your backend server and include
          a user token in the request.
        </p>
        <p>
          Make sure that you are signed into the extension. You can have the
          popup closed.
        </p>
        <button type="button" onClick={getToken} className="button invert">
          Get token from service worker
        </button>
        {token && <p>Token: {token}</p>}
      </div>
    </div>
  );
}
