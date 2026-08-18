// src/controllers/webhook.controller.js
const env = require("../config/exampleenv");
const { sendTextMessage } = require("../services/whatsapp.service");
const { handleUserQuery } = require("../services/rag.service");

exports.verifyWebhook = (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === env.verifyToken) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
};

exports.receiveMessage = async (req, res) => {
  res.sendStatus(200); // ack immediately

  try {
    const entry = req.body.entry?.[0];
    const change = entry?.changes?.[0];
    const message = change?.value?.messages?.[0];

    if (!message || message.type !== "text") return;

    const from = message.from;
    const text = message.text.body;

    const reply = await handleUserQuery(from, text);
    await sendTextMessage(from, reply);
  } catch (err) {
    console.error("Error processing webhook:", err);
  }
};