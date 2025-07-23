require("dotenv").config({
  path: "./.env",
});
require("rootpath")();
const express = require("express");
const bodyParser = require("body-parser");
const router = require("routes/api");
const passport = require("modules/oauth/passport");
const { swaggerUIServe,swaggerUISetup } = require("kernels/api-docs");
const cors = require("cors");
const app = express();
const path = require('path')
app.disable("x-powered-by");
// app.use(cors({
//   origin: "*", 
//   methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//   allowedHeaders: ["Content-Type", "Authorization"],
//   credentials: false // true if using cookies
// }));

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || origin === "null") {
      callback(null, true); 
    } else {
      callback(null, true); 
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false
}));


app.options("*", cors());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(bodyParser.json());
app.use("/", router);
app.use(passport.initialize());
app.use(express.json());

app.use("/api-docs", swaggerUIServe, swaggerUISetup);

module.exports = app
