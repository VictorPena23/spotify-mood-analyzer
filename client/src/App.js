// client/src/App.js
import React, { useEffect, useState } from 'react';

function App() {
  const [accessToken, setAccessToken] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("access_token");

    if (token) {
      setAccessToken(token);
      console.log("Access Token:", token);
    }
  }, []);

  return (
    <div>
      <h1>Spotify Mood Analyzer</h1>
      {accessToken ? (
        <p>You're logged in! Token is stored ✅</p>
      ) : (
        <a href="http://localhost:5000/login">Login with Spotify</a>
      )}
    </div>
  );
}

export default App;

