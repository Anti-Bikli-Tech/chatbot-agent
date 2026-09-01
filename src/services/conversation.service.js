

const prisma = require("../config/prisma");

async function findOrCreateConversation({ platform, phone, igUserId }) {
  const where =
    platform === "whatsapp" ? { platform, phone } : { platform, igUserId };

  let conversation = await prisma.conversation.findFirst({ where });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: { platform, phone, igUserId },
    });
  }
  return conversation;
}

async function saveMessage({ conversationId, role, content }) {
  const message = await prisma.message.create({
    data: { conversationId, role, content },
  });
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });
  return message;
}

module.exports = { prisma, findOrCreateConversation, saveMessage };