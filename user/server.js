const express = require("express");
const { authentication } = require("@prc/middlewares");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (username === "kinjal" && password === "123456") {
    const token = jwt.sign({ _id: 4 }, "myjwtsecretthatnobodyknows");
    return res.json({ token });
  } else {
    return res.status(401).json({ msg: "incorrect credentials!" });
  }
});

app.get("/user", authentication, (req, res) => {
  return res.json({
    msg: "Hello there!",
    user_id: req.user_id,
  });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, console.log(`Server is running on port ${PORT} 🚀`));
