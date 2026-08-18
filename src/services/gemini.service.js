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

async function generateReply({ systemInstruction, context, history, userMessage }) {
  const prompt = `
${systemInstruction}

Relevant context from knowledge base:
${context || "No relevant context found."}

Conversation history:
${history.map((m) => `${m.role}: ${m.content}`).join("\n")}

User: ${userMessage}
`.trim();

 const res = await ai.models.generateContent({
  model: "gemini-3.6-flash",
  contents: prompt,
});

  return res.text;
}

module.exports = { embedText, generateReply };