const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      const token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, "myjwtsecretthatnobodyknows");

      req.user_id = decoded._id;
      next();
    } catch (err) {
      return res
        .status(401)
        .json({ error: "Token expired or couldn't be verified!" });
    }
  } else {
    return res.status(401).json({ error: "Unauthorized: No token found" });
  }
};
