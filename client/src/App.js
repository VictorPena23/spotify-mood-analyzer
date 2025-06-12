import React, { useEffect, useState } from 'react';

function App() {
  const [accessToken, setAccessToken] = useState("");
  const [playlists, setPlaylists] = useState([]);
  const [tokenRequested, setTokenRequested] = useState(false);

  // Step 1: Exchange code for access token
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (code && !accessToken && !tokenRequested) {
      setTokenRequested(true); // prevent double request

      fetch(`http://localhost:5000/get-token?code=${code}`)
        .then(res => res.json())
        .then(data => {
          if (data.access_token) {
            setAccessToken(data.access_token);
            console.log("Access Token:", data.access_token);

            // ✅ Clear the code from the URL
            setTimeout(() => {
  window.history.replaceState({}, document.title, "/");
}, 100);

          } else {
            console.error("Token exchange failed:", data);
          }
        })
        .catch(err => console.error("Error exchanging token:", err));
    }
  }, [accessToken, tokenRequested]);

  // Step 2: Fetch playlists once token is available
  useEffect(() => {
    if (!accessToken) return;

    fetch("https://api.spotify.com/v1/me/playlists", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
      .then(res => res.json())
      .then(data => {
        console.log("Playlists:", data);
        setPlaylists(data.items || []);
      })
      .catch(err => {
        console.error("Failed to fetch playlists:", err);
      });
  }, [accessToken]);

  // Step 3: Fetch tracks from the first playlist
useEffect(() => {
  if (!accessToken || playlists.length === 0) return;

  const playlistId = playlists[0].id;

  fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
    .then(res => res.json())
    .then(data => {
      console.log("🎵 Tracks in Playlist:");
      data.items.forEach((item, index) => {
        const track = item.track;
        console.log(`${index + 1}. ${track.name} by ${track.artists.map(a => a.name).join(", ")}`);
      });
    })
    .catch(err => {
      console.error("Error fetching tracks:", err);
    });
}, [accessToken, playlists]);


  return (
    <div>
      <h1>Spotify Mood Analyzer</h1>
      {accessToken ? (
        <>
          <p>You're logged in! Token is stored ✅</p>
          <h2>Your Playlists:</h2>
          <ul>
            {playlists.map((playlist) => (
              <li key={playlist.id}>{playlist.name}</li>
            ))}
          </ul>
        </>
      ) : (
        <a href="http://localhost:5000/login">Login with Spotify</a>
      )}
    </div>
  );
}

export default App;
