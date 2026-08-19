const { GoogleGenAI } = require("@google/genai");
const env = require("../config/exampleenv");

const ai = new GoogleGenAI({ apiKey: env.geminiApiKey });

async function embedText(text) {
  const res = await ai.models.embedContent({
    model: "gemini-embedding-001",
    contents: text,
    config: {
      outputDimensionality: 768,
    },
  });
  return res.embeddings[0].values;
}

async function generateReply({ systemInstruction, context, history, userMessage }, retries = 3) {
  const prompt = `
${systemInstruction}

Relevant context from knowledge base:
${context || "No relevant context found."}

Conversation history:
${history.map((m) => `${m.role}: ${m.content}`).join("\n")}

User: ${userMessage}
`.trim();

  for (let i = 0; i < retries; i++) {
    try {
      const res = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
      });
      return res.text;
    } catch (err) {
      const isRetryable = err.status === 503 || err.status === 429;
      if (isRetryable && i < retries - 1) {
        console.warn(`Gemini ${err.status}, retrying... attempt ${i + 1}`);
        await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
        continue;
      }
      throw err;
    }
  }
}

module.exports = { embedText, generateReply };