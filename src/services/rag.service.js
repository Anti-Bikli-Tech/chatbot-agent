const { embedText, generateReply } = require("./gemini.service");
const { searchSimilarChunks } = require("./vectorStore.service");
const prisma = require("../config/prisma");

const SYSTEM_INSTRUCTION = `You are a helpful WhatsApp assistant. Answer clearly and concisely using the provided context. If the context doesn't contain the answer, say you don't have that information — do not make things up.`;

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
  const history = await getConversationHistory(conversation.id);
  const queryEmbedding = await embedText(userMessage);
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