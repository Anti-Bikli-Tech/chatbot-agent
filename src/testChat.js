const readline = require("readline");
const { handleUserQuery } = require("./services/rag.service");


const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log("Chat with your bot locally. Type 'exit' to quit.\n");

function ask() {
  rl.question("You: ", async (userMessage) => {
    if (userMessage.trim().toLowerCase() === "exit") {
      rl.close();
      process.exit(0);
    }

    try {
      const start = Date.now();
      const reply = await handleUserQuery({
        platform: "instagram",
        igUserId: "test-user-123", // fake ID, safe to reuse across runs
        userMessage,
      });
      console.log(`\nBot (${Date.now() - start}ms): ${reply}\n`);
    } catch (err) {
      console.error("Error:", err);
    }

    ask();
  });
}

ask();