
// const { GoogleGenAI } = require("@google/genai");
// const env = require("../config/exampleenv");


// const ai = new GoogleGenAI({ apiKey: env.geminiApiKey });

// async function embedText(text) {
//   const res = await ai.models.embedContent({
//     model: "gemini-embedding-001",
//     contents: text,
//     config: { outputDimensionality: 768 },
//   });
//   return res.embeddings[0].values;
// }

// async function generateReply({ systemInstruction, context, history, userMessage }, retries = 2) {
//   const messages = [
//     {
//       role: "system",
//       content: `${systemInstruction}\n\nRelevant context from knowledge base:\n${context || "No relevant context found."}`,
//     },
//     ...history.map((m) => ({
//       role: m.role === "assistant" ? "assistant" : "user",
//       content: m.content,
//     })),
//     { role: "user", content: userMessage },
//   ];

//   for (let i = 0; i < retries; i++) {
//     const controller = new AbortController();
//     const timeout = setTimeout(() => controller.abort(), 8000);
//     try {
//       const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${env.groqApiKey}`, 
//         },
//         body: JSON.stringify({
//           model: "llama-3.3-70b-versatile",
//           messages,
//           max_tokens: 400,
//         }),
//         signal: controller.signal,
//       });
//       clearTimeout(timeout);

//       if (!res.ok) {
//         const err = new Error(`Groq error ${res.status}`);
//         err.status = res.status;
//         throw err;
//       }

//       const data = await res.json();
//       return data.choices[0].message.content;
//     } catch (err) {
//       clearTimeout(timeout);
//       const isRetryable = err.status === 503 || err.status === 429 || err.name === "AbortError";
//       if (isRetryable && i < retries - 1) {
//         console.warn(`Groq ${err.status || "timeout"}, retrying... attempt ${i + 1}`);
//         await new Promise((r) => setTimeout(r, 500 * (i + 1)));
//         continue;
//       }
//       throw err;
//     }
//   }
// }

// module.exports = { embedText, generateReply };




const { GoogleGenAI } = require("@google/genai");
const env = require("../config/exampleenv");

const ai = new GoogleGenAI({ apiKey: env.geminiApiKey });

async function embedText(text, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.openaiApiKey}`,
        },
        body: JSON.stringify({
          model: "text-embedding-3-small",
          input: text,
          dimensions: 768,
        }),
      });
      if (!res.ok) {
        const err = new Error(`OpenAI embed error ${res.status}`);
        err.status = res.status;
        throw err;
      }
      const data = await res.json();
      return data.data[0].embedding;
    } catch (err) {
      const isRetryable = err.status === 429 || err.status === 503;
      if (isRetryable && i < retries - 1) {
        console.warn(`OpenAI embed ${err.status}, retrying... attempt ${i + 1}`);
        await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
        continue;
      }
      throw err;
    }
  }
}

async function generateReply({ systemInstruction, context, history, userMessage }, retries = 2) {
  const messages = [
    {
      role: "system",
      content: `${systemInstruction}\n\nRelevant context from knowledge base:\n${context || "No relevant context found."}`,
    },
    ...history.map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    })),
    { role: "user", content: userMessage },
  ];

  for (let i = 0; i < retries; i++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.openaiApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages,
          max_tokens: 400,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        const err = new Error(`OpenAI error ${res.status}`);
        err.status = res.status;
        throw err;
      }

      const data = await res.json();
      return data.choices[0].message.content;
    } catch (err) {
      clearTimeout(timeout);
      const isRetryable = err.status === 503 || err.status === 429 || err.name === "AbortError";
      if (isRetryable && i < retries - 1) {
        console.warn(`OpenAI ${err.status || "timeout"}, retrying... attempt ${i + 1}`);
        await new Promise((r) => setTimeout(r, 500 * (i + 1)));
        continue;
      }
      throw err;
    }
  }
}

module.exports = { embedText, generateReply };