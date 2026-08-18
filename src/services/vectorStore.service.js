const prisma = require("../config/prisma");

// Store a chunk + its embedding
async function saveChunk({ documentId, content, embedding }) {
  // pgvector expects a string like '[0.1,0.2,...]'
  const vectorLiteral = `[${embedding.join(",")}]`;

  await prisma.$executeRaw`
    INSERT INTO "Chunk" (id, "documentId", content, embedding, "createdAt")
    VALUES (gen_random_uuid(), ${documentId}, ${content}, ${vectorLiteral}::vector, now())
  `;
}

// Find top-k most similar chunks to a query embedding
async function searchSimilarChunks(queryEmbedding, topK = 5) {
  const vectorLiteral = `[${queryEmbedding.join(",")}]`;

  const results = await prisma.$queryRaw`
    SELECT id, content, "documentId",
           embedding <-> ${vectorLiteral}::vector AS distance
    FROM "Chunk"
    ORDER BY distance ASC
    LIMIT ${topK}
  `;

  return results;
}

module.exports = { saveChunk, searchSimilarChunks };