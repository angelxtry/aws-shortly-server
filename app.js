require("dotenv").config();
const express = require("express");
const http = require("http");
const bodyParser = require("body-parser");
const cors = require("cors");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const urls = require("./models").urls;
const clicks = require("./models").clicks;
const users = require("./models").users;

const utils = require("./modules/utils");
const { verifyToken } = require("./routes/middleware");

const app = express();
const port = 5000;

app.use(
  session({
    secret: "@codestates"
  })
);
app.use(morgan("dev"));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(
  cors({
    origin: true,
    credentials: true
  })
);

const isExistSessionUserid = session => Boolean(session.userid);

app.get("/", (req, res) => {
  res.status(200).send("Success"); // OK
});

/**
 * url : /user/signup
 * description : 유저 회원가입
 */
app.post("/user/signup", async (req, res) => {
  // console.log(req.body);
  // 회원가입이 끝나면 로그인 페이지로 가야한다.
  const { email, password } = req.body;
  try {
    const user = await users.findOne({ where: { email } });
    console.log(user);
    if (user) {
      res.status(400).send("email exist.");
    } else {
      const encryptPass = await bcrypt.hash(password, 5);
      await users.create({
        email: email,
        password: encryptPass
      });
      res.status(200).send("success.");
    }
  } catch (err) {
    console.log(err);
    res.status(400).send("signup error.");
  }
});

/**
 * url : /user/signin
 * description : 유저 로그인
 */

app.post("/user/signin", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await users.findOne({ where: { email } });
    console.log(user);
    if (user) {
      const isPasswordCorrect = await bcrypt.compare(password, user.password);
      if (isPasswordCorrect) {
        const token = jwt.sign(
          { id: user.id, email: user.email },
          process.env.JWT_SECRET,
          {
            expiresIn: "1h",
            issuer: "suho"
          }
        );
        console.log("JWT: ", token);
        res.status(200).json({ code: 200, message: "Token issued.", token });
      }
    } else {
      res.status(401).json({ code: 401, message: "Signin fail." });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ code: 500, message: "Server error" });
  }
});

/**
 * url : /user/signout
 * description : 유저 로그 아웃
 */
app.get("/user/signout", (req, res) => {
  const session = req.session;
  if (session) {
    session.destroy();
  }
  // res.redirect("/");
  res.writeHead(302, { Location: "/Login" });
  res.end();
});

/**
 * url : /user/info
 * description : 유저 정보
 */
app.get("/user/info", verifyToken, async (req, res) => {
  console.log("GET /user/info - token: ", req.decoded);
  try {
    const user = await users.findOne({ where: { email: req.decoded.email } });
    if (user) {
      res.status(200).json(user);
    } else {
      res.status(400).json({ code: 400, message: "user info error." });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ code: 500, message: "Server error." });
  }
});

app.get("/links", verifyToken, async (req, res) => {
  console.log("GET /links - token: ", req.decoded);
  try {
    const results = await urls.findAll({ where: { userId: req.decoded.id } });
    // const results = await urls.findAll();
    if (results) {
      res.status(200).json(results); // OK
    } else {
      res.sendStatus(204); // No Content
    }
  } catch (err) {
    console.log(err);
    res.status(500).send(error); // Server error
  }
});

app.post("/links", verifyToken, (req, res) => {
  console.log("POST /links - token: ", req.decoded);
  const { url } = req.body; // const url = req.body.url

  if (!utils.isValidUrl(url)) {
    console.log("Bad Request");
    return res.sendStatus(400); // Bad Request
  }

  utils.getUrlTitle(url, (err, title) => {
    if (err) {
      console.log(err);
      return res.sendStatus(400);
    }

    urls
      .create({
        url: url,
        baseUrl: req.headers.host,
        title: title,
        userId: req.decoded.id
      })
      .then(result => {
        res.status(201).json(result); // Created
      })
      .catch(error => {
        console.log(error);
        res.sendStatus(500); // Server error
      });
  });
});

app.get("/*", (req, res) => {
  urls
    .findOne({
      where: {
        code: req.params[0]
      }
    })
    .then(result => {
      if (result) {
        result.updateAttributes({
          visits: result.visits + 1
        });
        res.redirect(result.url);
      } else {
        res.sendStatus(204);
      }
    })
    .catch(error => {
      console.log(error);
      res.sendStatus(500);
    });
});

app.set("port", port);
app.listen(app.get("port"), () => {
  console.log(`${app.get("port")} PORT!`);
});

module.exports = app;
