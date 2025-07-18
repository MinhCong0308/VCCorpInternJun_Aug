const app = require("configs/app")
const database = require("configs/database")
const hashing = require("configs/hashing")
const jwt = require("configs/jwt")
const {roleenum, statusenum, statuspostenum, statuscode} = require("configs/enum");

const config = {
    app,
    database,
    jwt,
    hashing,
    roleenum,
    statusenum,
    statuspostenum,
    statuscode
}

module.exports.config = config