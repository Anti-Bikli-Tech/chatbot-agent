const { GoogleGenAI } = require("@google/genai");
const env = require("../config/exampleenv");

const ai = new GoogleGenAI({ apiKey: env.geminiApiKey });

async function embedText(text, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await ai.models.embedContent({
        model: "gemini-embedding-001",
        contents: text,
        config: { outputDimensionality: 768 },
      });
      return res.embeddings[0].values;
    } catch (err) {
      const isRetryable = err.status === 429 || err.status === 503;
      if (isRetryable && i < retries - 1) {
        console.warn(`Gemini embed ${err.status}, retrying... attempt ${i + 1}`);
        await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
        continue;
      }
      throw err;
    }
  }
}

module.exports = { embedText };