require("dotenv").config({
  path: "./.env",
});
require("rootpath")();
const express = require("express");
const bodyParser = require("body-parser");
const router = require("routes/api");
const passport = require("modules/oauth/passport");
const cookieParser = require("cookie-parser");
const { swaggerUIServe,swaggerUISetup } = require("kernels/api-docs");
const cors = require("cors");
const app = express();
const path = require('path');
const globalFilter = require("utils/globalFilter"); // Import global filter

try {
  globalFilter.initialize();
  console.log('Global bad words filter initialized successfully');
} catch (error) {
  console.error('Failed to initialize global bad words filter:', error);
  process.exit(1); // Exit if filter initialization fails
}

app.disable("x-powered-by");
const corsOptions = {
  origin: "http://localhost:4200", 
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true  // using cookies
};

app.use(cors(corsOptions)); 
app.use(bodyParser.json());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use(cookieParser());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(passport.initialize());
app.use("/", router);
app.use("/api-docs", swaggerUIServe, swaggerUISetup);

module.exports = app;
