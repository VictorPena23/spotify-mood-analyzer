import React, { useEffect, useState } from 'react';

function App() {
  const [accessToken, setAccessToken] = useState("");
  const [playlists, setPlaylists] = useState([]);
  const [mood, setMood] = useState(null);

  // Step 1: Get access token from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (code && !accessToken) {
      fetch(`http://localhost:5000/get-token?code=${code}`)
        .then(res => res.json())
        .then(data => {
          if (data.access_token) {
            setAccessToken(data.access_token);
            window.history.replaceState({}, document.title, "/");
          } else {
            console.error("Token exchange failed:", data);
          }
        });
    }
  }, [accessToken]);

  // Step 2: Fetch user playlists
  useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");

  if (code && !accessToken) {
    fetch(`http://localhost:5000/get-token?code=${code}`)
      .then(res => res.json())
      .then(data => {
        console.log("🔐 Received token data:", data); // ✅ Add this
        if (data.access_token) {
          setAccessToken(data.access_token);
          window.history.replaceState({}, document.title, "/");
        } else {
          console.error("Token exchange failed:", data);
        }
      })
      .catch(err => console.error("Error exchanging token:", err));
  }
}, [accessToken]);


  // Step 3: Fetch and analyze playlist mood
const analyzeMood = async (playlistId) => {
  try {
    console.log("Analyzing playlist:", playlistId);

    const trackRes = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const trackData = await trackRes.json();
    if (!trackRes.ok) {
      console.error("Error fetching tracks:", trackData);
      return;
    }

    const trackIds = trackData.items
      .map(item => item.track?.id)
      .filter(Boolean)
      .slice(0, 100); // Enforce 100-track limit

    if (trackIds.length === 0) {
      console.warn("No valid tracks to analyze.");
      return;
    }

    const audioFeatureUrl = `https://api.spotify.com/v1/audio-features?ids=${trackIds.join(',')}`;
    console.log("Fetching audio features:", audioFeatureUrl);

    const featureRes = await fetch(audioFeatureUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const featureData = await featureRes.json();
    if (!featureRes.ok) {
      console.error("Audio features fetch error:", featureData);
      return;
    }

    const features = featureData.audio_features?.filter(f => f) || [];
    const avg = (key) =>
      (features.reduce((acc, curr) => acc + curr[key], 0) / features.length).toFixed(2);

    setMood({
      valence: avg("valence"),
      energy: avg("energy"),
      danceability: avg("danceability"),
    });
  } catch (error) {
    console.error("Unexpected error during mood analysis:", error);
  }
};


  return (
    <div>
      <h1>Spotify Mood Analyzer</h1>

      {!accessToken ? (
        <a href="http://localhost:5000/login">Login with Spotify</a>
      ) : (
        <>
          <p>You're logged in ✅</p>
          <h2>Your Playlists:</h2>
          <ul>
            {playlists.map(playlist => (
              <li key={playlist.id}>
                <button onClick={() => analyzeMood(playlist.id)}>
                  {playlist.name}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {mood && (
        <div>
          <h2>Playlist Mood Analysis</h2>
          <p>Valence (Happiness): {mood.valence}</p>
          <p>Energy: {mood.energy}</p>
          <p>Danceability: {mood.danceability}</p>
        </div>
      )}
    </div>
  );
}

export default App;
