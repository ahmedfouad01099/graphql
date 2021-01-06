const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authHeader = req.get("Authorization");
  if (!authHeader) {
    req.isAuth = false;
    return next();
  }
  const token = req.get("Authorization").split(" ")[1];
  let decodeToken;
  try {
    decodeToken = jwt.verify(token, "somesupersecretsecret");
  } catch (err) {
    req.isAuth = false;
    return next();
  }
  if (!decodeToken) {
    req.isAuth = false;
    return next();
  }
  req.userId = decodeToken.userId;
  // console.log(req.userId);
  req.isAuth = true;
  next();
};
