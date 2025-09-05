const app = require("configs/app");
const database = require("configs/database");
const hashing = require("configs/hashing");
const jwt = require("configs/jwt");
const {
  roleenum,
  statusenum,
  statuspostenum,
  statuscode,
  statusUser,
  StatusNameById,
  languageEnum
} = require("configs/enum");
const oauthConfig = require("configs/oauth-config");

const config = {
  app,
  database,
  jwt,
  hashing,
  roleenum,
  statusenum,
  statuspostenum,
  languageEnum,
  oauth: oauthConfig.oauth,
  statuscode,
  statusUser,
  StatusNameById
};

module.exports.config = config;
