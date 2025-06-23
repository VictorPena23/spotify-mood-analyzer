import React, { useEffect, useState } from 'react';

function App() {
  const [accessToken, setAccessToken] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [playlists, setPlaylists] = useState([]);
  const [mood, setMood] = useState(null);

  // Step 1: Get token from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (code && !accessToken) {
      fetch(`http://127.0.0.1:5000/get-token?code=${code}`)
        .then(res => res.json())
        .then(data => {
          console.log("🔐 Received token data:", data);
          if (data.access_token) {
            setAccessToken(data.access_token);
            setRefreshToken(data.refresh_token); // Save refresh token
            window.history.replaceState({}, document.title, "/");
          } else {
            console.error("❌ Token exchange failed:", data);
          }
        })
        .catch(err => console.error("❌ Error exchanging token:", err));
    }
  }, [accessToken]);

  // Step 2: Refresh token if expired (optional on-demand)
  const refreshAccessToken = async () => {
    if (!refreshToken) return;

    try {
      const res = await fetch(`http://127.0.0.1:5000/refresh-token?refresh_token=${refreshToken}`);
      const data = await res.json();

      if (data.access_token) {
        console.log("🔄 Access token refreshed");
        setAccessToken(data.access_token);
      } else {
        console.error("❌ Refresh failed:", data);
      }
    } catch (err) {
      console.error("💥 Error refreshing token:", err);
    }
  };

  // Step 3: Fetch user's playlists
  useEffect(() => {
    if (!accessToken) return;

    fetch("https://api.spotify.com/v1/me/playlists", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(res => res.json())
      .then(data => {
        console.log("🎵 Playlists:", data);
        setPlaylists(data.items || []);
      })
      .catch(err => console.error("❌ Failed to fetch playlists:", err));
  }, [accessToken]);

  // Step 4: Analyze mood from track IDs
  const analyzeMood = async (playlistId = null) => {
    let trackIds = [];

    try {
      if (playlistId) {
        console.log("🎯 Analyzing playlist:", playlistId);
        const trackRes = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        const trackData = await trackRes.json();
        if (!trackRes.ok) {
          console.error("❌ Error fetching tracks:", trackData);
          return;
        }

        trackIds = trackData.items
          .map(item => item.track?.id)
          .filter(Boolean)
          .slice(0, 100);
      } else {
        // Fallback for testing single hardcoded track
        trackIds = ["0uMZbmAAgOhdMrv25iPEH6"];
        console.log("🧪 Testing with track:", trackIds);
      }

      const featureUrl = `https://api.spotify.com/v1/audio-features?ids=${trackIds.join(",")}`;
      console.log("🎧 Fetching audio features:", featureUrl);
      console.log("🪪 Token used:", accessToken);

      const featureRes = await fetch(featureUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const featureData = await featureRes.json();
      if (!featureRes.ok) {
        console.log("📛 Full Spotify Error:", featureData);
        console.error("❌ Failed to fetch features:", featureData);

        // Optional: Try refreshing the token
        await refreshAccessToken();
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
    } catch (err) {
      console.error("💥 Unexpected error during mood analysis:", err);
    }
  };

  return (
    <div>
      <h1>Spotify Mood Analyzer</h1>

      {!accessToken ? (
        <a href="http://127.0.0.1:5000/login">Login with Spotify</a>
      ) : (
        <>
          <p>You're logged in ✅</p>
          <button onClick={refreshAccessToken}>🔄 Refresh Access Token</button>

          <h2>Your Playlists:</h2>
          <ul>
            {playlists.map((playlist) => (
              <li key={playlist.id}>
                <button onClick={() => analyzeMood(playlist.id)}>{playlist.name}</button>
              </li>
            ))}
          </ul>

          <button onClick={() => analyzeMood()}>🧪 Test Mood Analysis</button>
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
