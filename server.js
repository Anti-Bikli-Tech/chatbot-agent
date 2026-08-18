const app = require("./src/app");
const env = require("./src/config/exampleenv");

app.listen(env.port, () => {
  console.log(`Server running on port ${env.port}`);
});