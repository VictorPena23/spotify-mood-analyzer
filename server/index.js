const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = "http://127.0.0.1:3000/callback"; // ✅ Matches Spotify Dashboard

app.get("/login", (req, res) => {
  const scope = "user-read-private user-read-email playlist-read-private playlist-read-collaborative user-library-read user-top-read user-read-playback-position";


  const authURL = `https://accounts.spotify.com/authorize?response_type=code&client_id=${CLIENT_ID}&scope=${encodeURIComponent(
  scope
)}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&show_dialog=true`;

  res.redirect(authURL);

});


app.get("/refresh-token", async (req, res) => {
  const refresh_token = req.query.refresh_token;
  if (!refresh_token) return res.status(400).json({ error: "Missing refresh_token" });

  try {
    const refreshResponse = await axios.post(
      "https://accounts.spotify.com/api/token",
      new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    console.log("🔁 Token refreshed successfully");
    res.json(refreshResponse.data); // contains new access_token
  } catch (error) {
    console.error("🔴 Refresh Token Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to refresh access token" });
  }
});


app.listen(5000, () => {
  console.log("🚀 Server running on http://127.0.0.1:5000");
});
