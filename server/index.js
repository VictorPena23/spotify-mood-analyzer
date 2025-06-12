const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = "http://127.0.0.1:3000/callback";

app.get("/login", (req, res) => {
  const scope = "user-read-private user-read-email playlist-read-private playlist-read-collaborative";
  const authURL = `https://accounts.spotify.com/authorize?response_type=code&client_id=${CLIENT_ID}&scope=${encodeURIComponent(scope)}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
  res.redirect(authURL);
});

app.get("/callback", async (req, res) => {
  const code = req.query.code;

  try {
    const tokenResponse = await axios.post("https://accounts.spotify.com/api/token", new URLSearchParams({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: REDIRECT_URI,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }
    });

    const { access_token, refresh_token } = tokenResponse.data;

    // For now, send the tokens to the frontend (later you can store them or redirect)
    res.redirect(`http://localhost:3000?access_token=${access_token}&refresh_token=${refresh_token}`);
  } catch (error) {
    console.error("Token Error:", error.response?.data || error.message);
    res.status(500).send("Failed to get access token");
  }
});

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});
