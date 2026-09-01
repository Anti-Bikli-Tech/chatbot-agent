const env = require("../config/exampleenv");
const { sendTextMessage: sendWhatsApp } = require("../services/whatsapp.service");
const { sendTextMessage: sendInstagram } = require("../services/instagram.service");
const { handleUserQuery } = require("../services/rag.service");
const { findOrCreateConversation, saveMessage } = require("../services/conversation.service");
const { getIO } = require("../socket"); 

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
  res.sendStatus(200);

  try {
    const entry = req.body.entry?.[0];
    const io = getIO();

    // Instagram
    if (req.body.object === "instagram") {
      const messaging = entry?.messaging?.[0];
      const senderId = messaging?.sender?.id;
      const text = messaging?.message?.text;
      if (!senderId || !text) return;

      const conversation = await findOrCreateConversation({
        platform: "instagram",
        igUserId: senderId,
      });
      const incoming = await saveMessage({ conversationId: conversation.id, role: "user", content: text });
      io.emit("new_message", { conversationId: conversation.id, message: incoming });

      if (conversation.mode === "human") return; // agent is handling, bot chup rahega

      const reply = await handleUserQuery({ platform: "instagram", igUserId: senderId, userMessage: text });
      await sendInstagram(senderId, reply);
      const outgoing = await saveMessage({ conversationId: conversation.id, role: "bot", content: reply });
      io.emit("new_message", { conversationId: conversation.id, message: outgoing });
      return;
    }

    // WhatsApp
    const change = entry?.changes?.[0];
    const message = change?.value?.messages?.[0];
    if (!message || message.type !== "text") return;

    const from = message.from;
    const text = message.text.body;

    const conversation = await findOrCreateConversation({ platform: "whatsapp", phone: from });
    const incoming = await saveMessage({ conversationId: conversation.id, role: "user", content: text });
    io.emit("new_message", { conversationId: conversation.id, message: incoming });

    if (conversation.mode === "human") return;

    const reply = await handleUserQuery({ platform: "whatsapp", phone: from, userMessage: text });
    await sendWhatsApp(from, reply);
    const outgoing = await saveMessage({ conversationId: conversation.id, role: "bot", content: reply });
    io.emit("new_message", { conversationId: conversation.id, message: outgoing });
  } catch (err) {
    console.error("Error processing webhook:", err);
  }
};