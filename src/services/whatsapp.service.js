const axios = require("axios");
const env = require("../config/env");

const BASE_URL = `https://graph.facebook.com/v20.0/${env.phoneNumberId}/messages`;

async function sendTextMessage(to, text) {
  try {
    const res = await axios.post(
      BASE_URL,
      {
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: text },
      },
      {
        headers: {
          Authorization: `Bearer ${env.whatsappToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    return res.data;
  } catch (err) {
    console.error(
      "WhatsApp send error:",
      err.response?.data || err.message
    );
    throw err;
  }
}

module.exports = { sendTextMessage };