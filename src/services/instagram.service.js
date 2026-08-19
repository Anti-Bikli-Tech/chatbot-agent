const axios = require("axios");
const env = require("../config/exampleenv");

const BASE_URL = `https://graph.instagram.com/v20.0/me/messages`;

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
    console.log("Instagram send success:", res.data);
    return res.data;
  } catch (err) {
    console.error("Instagram send error:", JSON.stringify(err.response?.data || err.message, null, 2));
    throw err;
  }
}

module.exports = { sendTextMessage };