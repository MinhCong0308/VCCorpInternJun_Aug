const app = require("configs/app")
const database = require("configs/database")
const hashing = require("configs/hashing")
const jwt = require("configs/jwt")
const {roleenum, statusenum, statuspostenum} = require("configs/enum");
const oauthConfig = require("configs/oauth-config");

const config = {
    app,
    database,
    jwt,
    hashing,
    roleenum,
    statusenum,
    statuspostenum,
    oauth: oauthConfig.oauth
}

module.exports.config = config