const { embedText  } = require("./gemini.service");
const { generateReply } = require("./llm.service");
const { searchSimilarChunks } = require("./vectorStore.service");
const prisma = require("../config/prisma");

const SYSTEM_INSTRUCTION = `You are a friendly customer support assistant for Anti Bikli Ventures and its brands (Krisha Organic, Safe Safar, Freshmart Now, Dead End Bites, Helmo Guard, Harsheel Water).

Formatting rules for WhatsApp/Instagram (plain text chat, not a document):

- Keep answers very short and conversational — 2-5 sentences, or a simple flat list using "-" if listing items.
- Use relevant emojis naturally to make replies warm and engaging (e.g. 🌿 for organic products, 📦 for orders, 📞 for support, ✅ for confirmations) — but don't overdo it, 1-3 emojis per reply is enough.
- Use *single asterisks* for bold (WhatsApp's bold syntax), never double asterisks or markdown headers.
- If listing multiple items (like products or brands), use a simple flat "-" list, one line each, no sub-bullets.

Answer using the provided context. If the context doesn't contain the answer, or the user is asking for more detailed help than you can give (e.g. order-specific issues, complaints, or anything beyond general info), say you don't have that information and direct them to:
📞 +91 9762036368
📧 info.antibikliventures@gmail.com or info@antibikliventures.com
Do not make things up.`;
async function getConversationHistory(conversationId, limit = 10) {
  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return messages.reverse();
}

async function saveMessage(conversationId, role, content) {
  await prisma.message.create({
    data: { conversationId, role, content },
  });
}
async function getActiveTicket({ platform, phone, igUserId }) {
  const where = platform === "whatsapp"
    ? { platform, phone, status: "open" }
    : { platform, igUserId, status: "open" };

  let conversation = await prisma.conversation.findFirst({
    where,
    orderBy: { createdAt: "desc" },
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: { platform, phone, igUserId, status: "open" },
    });
  }

  return conversation;
}

async function handleUserQuery({ platform, phone, igUserId, userMessage }) {
  const conversation = await getActiveTicket({ platform, phone, igUserId });

 
  const [history, queryEmbedding] = await Promise.all([
    getConversationHistory(conversation.id, 6), 
    embedText(userMessage),
  ]);

  const chunks = await searchSimilarChunks(queryEmbedding, 5);
  const context = chunks.map((c) => c.content).join("\n---\n");

  let reply;
  try {
    reply = await generateReply({ systemInstruction: SYSTEM_INSTRUCTION, context, history, userMessage });
  } catch (err) {
    console.error("Gemini generateReply failed after retries:", err.message);
    reply = "Abhi thodi technical dikkat aa rahi hai, thodi der baad try karo.";
  }

  await saveMessage(conversation.id, "user", userMessage);
  await saveMessage(conversation.id, "assistant", reply);
  return reply;
}



async function closeTicket(conversationId) {
  return prisma.conversation.update({
    where: { id: conversationId },
    data: { status: "closed" },
  });
}

async function getTicketHistory(phone) {
  return prisma.conversation.findMany({
    where: { phone },
    include: { messages: { orderBy: { createdAt: "asc" } } },
    orderBy: { createdAt: "desc" },
  });
}

module.exports = { handleUserQuery, closeTicket, getTicketHistory };