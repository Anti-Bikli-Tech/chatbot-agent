const CHUNK_SIZE = 800; // characters, not tokens (rough proxy)
const CHUNK_OVERLAP = 100;

function chunkText(text) {
  const cleaned = text.replace(/\s+/g, " ").trim();
  const chunks = [];

  let start = 0;
  while (start < cleaned.length) {
    const end = Math.min(start + CHUNK_SIZE, cleaned.length);
    chunks.push(cleaned.slice(start, end));
    start += CHUNK_SIZE - CHUNK_OVERLAP;
  }

  return chunks;
}

module.exports = { chunkText };