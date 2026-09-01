const http = require("http");
const app = require("./src/app");
const env = require("./src/config/exampleenv");
const { initIO } = require("./src/socket");

const server = http.createServer(app);
initIO(server);

server.listen(env.port, () => {
  console.log(`Server running on port ${env.port}`);
});