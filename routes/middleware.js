const jwt = require("jsonwebtoken");

exports.verifyToken = (req, res, next) => {
  try {
    // console.log("verifyToken: ", req.headers.auth);
    req.decoded = jwt.verify(req.headers.auth, process.env.JWT_SECRET);
    console.log("verifyToken: ", req.decoded);
    return next();
  } catch (err) {
    console.log("verifyToken - ERROR: ", err);
    if (err.name === "TokenExpiredError") {
      return res.status(400).json({
        code: 400,
        message: "토큰이 만료되었습니다."
      });
    }
    return res.status(401).json({
      code: 401,
      message: "유효하지 않은 토큰입니다."
    });
  }
};
