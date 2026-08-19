const axios = require("axios");
const env = require("../config/exampleenv");

const BASE_URL = `https://graph.facebook.com/v20.0/me/messages`;

async function sendTextMessage(recipientId, text) {
  try {
    const res = await axios.post(
      `${BASE_URL}?access_token=${env.instagramToken}`,
      {
        recipient: { id: recipientId },
        message: { text },
      },
      { headers: { "Content-Type": "application/json" } }
    );
    return res.data;
  } catch (err) {
    console.error("Instagram send error:", err.response?.data || err.message);
    throw err;
  }
}

module.exports = { sendTextMessage };