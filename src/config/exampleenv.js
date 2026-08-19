require("dotenv").config();

const required = [
  "WHATSAPP_TOKEN",
  "PHONE_NUMBER_ID",
  "VERIFY_TOKEN",
  "DATABASE_URL",
  "GEMINI_API_KEY",
  "INSTAGRAM_TOKEN",
  "INSTAGRAM_PAGE_ID",
  
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required env variable: ${key}`);
  }
}

module.exports = {
  port: process.env.PORT || 3000,
  whatsappToken: process.env.WHATSAPP_TOKEN,
  phoneNumberId: process.env.PHONE_NUMBER_ID,
  verifyToken: process.env.VERIFY_TOKEN,
  geminiApiKey: process.env.GEMINI_API_KEY,
  instagramToken: process.env.INSTAGRAM_TOKEN,
  instagramPageId: process.env.INSTAGRAM_PAGE_ID,
};