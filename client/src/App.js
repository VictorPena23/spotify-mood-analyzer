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
      fetch(`http://127.0.0.1:5000/get-token?code=${code}`)
        .then(res => res.json())
        .then(data => {
          console.log("🔐 Received token data:", data);
          if (data.access_token) {
            setAccessToken(data.access_token);
            window.history.replaceState({}, document.title, "/");
          } else {
            console.error("❌ Token exchange failed:", data);
          }
        })
        .catch(err => console.error("❌ Error exchanging token:", err));
    }
  }, [accessToken]);

  // Step 2: Fetch user playlists
  useEffect(() => {
    if (!accessToken) return;

    fetch("https://api.spotify.com/v1/me/playlists", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
      .then(res => res.json())
      .then(data => {
        console.log("🎵 Playlists:", data);
        setPlaylists(data.items || []);
      })
      .catch(err => console.error("❌ Failed to fetch playlists:", err));
  }, [accessToken]);

  // Step 3: Analyze playlist mood
 const analyzeMood = async () => {
  const testTrackIds = ["0uMZbmAAgOhdMrv25iPEH6"]; // use 1–2 valid track IDs

  console.log("🧪 Testing with track:", testTrackIds);

  const featureUrl = `https://api.spotify.com/v1/audio-features?ids=${testTrackIds.join(",")}`;
  console.log("🎧 Testing URL:", featureUrl);
  console.log("🪪 Token used:", accessToken);

  try {
    const res = await fetch(featureUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("❌ Failed to fetch features:", data);
      return;
    }

    console.log("✅ Audio Features:", data);
    setMood({
      valence: data.audio_features[0].valence,
      energy: data.audio_features[0].energy,
      danceability: data.audio_features[0].danceability,
    });
  } catch (err) {
    console.error("💥 Unexpected error:", err);
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
          <h2>Your Playlists:</h2>
<ul>
  {playlists.map(playlist => (
    <li key={playlist.id}>
      <button onClick={() => analyzeMood(playlist.id)}>{playlist.name}</button>
    </li>
  ))}
</ul>

<button onClick={analyzeMood}>Test Mood Analysis</button>

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
