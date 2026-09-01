const { prisma } = require("../services/conversation.service");
const { sendTextMessage: sendWhatsApp } = require("../services/whatsapp.service");
const { sendTextMessage: sendInstagram } = require("../services/instagram.service");
const { getIO } = require("../socket");

exports.listConversations = async (req, res) => {
  const conversations = await prisma.conversation.findMany({
    orderBy: { updatedAt: "desc" },
    include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  res.json(conversations);
};

exports.getMessages = async (req, res) => {
  const { id } = req.params;
  const messages = await prisma.message.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "asc" },
  });
  res.json(messages);
};

exports.sendManualMessage = async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;

  const conversation = await prisma.conversation.update({
    where: { id },
    data: { mode: "human" }, // dashboard se reply karte hi bot pause
  });

  if (conversation.platform === "whatsapp") {
    await sendWhatsApp(conversation.phone, text);
  } else {
    await sendInstagram(conversation.igUserId, text);
  }

  const message = await prisma.message.create({
    data: { conversationId: id, role: "agent", content: text },
  });

  getIO().emit("new_message", { conversationId: id, message });
  res.json(message);
};

exports.toggleMode = async (req, res) => {
  const { id } = req.params;
  const { mode } = req.body; // "bot" | "human"
  const conversation = await prisma.conversation.update({ where: { id }, data: { mode } });
  res.json(conversation);
};