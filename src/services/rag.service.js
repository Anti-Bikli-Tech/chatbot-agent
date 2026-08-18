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

async function getActiveTicket(phone) {
  let conversation = await prisma.conversation.findFirst({
    where: { phone, status: "open" },
    orderBy: { createdAt: "desc" },
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: { phone, status: "open" },
    });
  }

  return conversation;
}

async function handleUserQuery(phone, userMessage) {
  const conversation = await getActiveTicket(phone);
  const history = await getConversationHistory(conversation.id);

  // 2. Embed the query and retrieve relevant chunks
  const queryEmbedding = await embedText(userMessage);
  const chunks = await searchSimilarChunks(queryEmbedding, 5);
  const context = chunks.map((c) => c.content).join("\n---\n");

  // 3. Generate reply
  const reply = await generateReply({
    systemInstruction: SYSTEM_INSTRUCTION,
    context,
    history,
    userMessage,
  });

  // 4. Save both messages to history
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