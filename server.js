const http = require("http");
const app = require("./src/app");
const env = require("./src/config/exampleenv");
const { initIO } = require("./src/socket");
const prisma = require("./src/config/prisma");

const server = http.createServer(app);
initIO(server);

async function start() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("Database connection warmed");
  } catch (err) {
    console.error("Failed to warm database connection:", err);
  }

  server.listen(env.port, () => {
    console.log(`Server running on port ${env.port}`);
  });
}

start();