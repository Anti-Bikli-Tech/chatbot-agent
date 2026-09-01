const express = require("express");
const router = express.Router();
const {
  listConversations,
  getMessages,
  sendManualMessage,
  toggleMode,
} = require("../controllers/dashboard.controller");

router.get("/api/conversations", listConversations);
router.get("/api/conversations/:id/messages", getMessages);
router.post("/api/conversations/:id/send", sendManualMessage);
router.patch("/api/conversations/:id/mode", toggleMode);

module.exports = router;