require("dotenv").config();

module.exports = {
  environment: process.env.DATABASE_ENV || "development",
  development: {
    username: process.env.DATABASE_USERNAME || "root",
    password: process.env.DATABASE_PASSWORD || "root",
    database: process.env.DATABASE_NAME || "core",
    host: process.env.DATABASE_HOST || "localhost",
    port: process.env.DATABASE_PORT || 3306,
    dialect: "mysql",
    dialectOptions: {
      bigNumberStrings: true,
      socketPath: process.env.DATABASE_SOCKET || "",
    },
  },
  test: {
    username: process.env.DATABASE_TEST_USERNAME,
    password: process.env.DATABASE_TEST_PASSWORD,
    database: process.env.DATABASE_TEST_NAME,
    host: process.env.DATABASE_TEST_HOST || "127.0.0.1",
    port: process.env.DATABASE_TEST_PORT || 3306,
    dialect: "mysql",
    dialectOptions: {
      bigNumberStrings: true,
      socketPath: process.env.DATABASE_TEST_SOCKET || "",
      charset: "utf8mb4"
    },
  },
  production: {
    username: process.env.PROD_DB_USERNAME,
    password: process.env.PROD_DB_PASSWORD,
    database: process.env.PROD_DB_NAME,
    host: process.env.PROD_DB_HOSTNAME,
    port: process.env.PROD_DB_PORT,
    dialect: "mysql",
    dialectOptions: {
      bigNumberStrings: true,
    },
  },
};
