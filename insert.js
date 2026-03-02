const { User } = require("./models");

await User.create({
  name: "Devansh",
  email: "dev@email.com"
});