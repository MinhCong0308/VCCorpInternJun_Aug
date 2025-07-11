// index.js
const { config } = require('configs')
const {Sequelize} = require('sequelize')
const {Umzug, SequelizeStorage} = require('umzug')

const testDb = config.database.test;

// for performing query for updating database through js object (ORM)
const sequelize = new Sequelize(testDb.database, testDb.username,testDb.password, {
    host: testDb.host,
    dialect: 'mysql',
    dialectOptions: testDb.dialectOptions
})

// for manage the different version of Database Change, supports for controlling various case when needs updating or rollback version
const umzug = new Umzug({
    migrations: {
        glob: 'database/migrations/*.js',
        resolve: ({ name, path, context }) => {
            const migration = require(path || '')
            return {
                name,
                up: async () => migration.up(context, Sequelize),
                down: async () => migration.down(context, Sequelize),
            }
        },
    },
    context: sequelize.getQueryInterface(),
    storage: new SequelizeStorage({sequelize}),
    logger: console,
    logging: false
})

module.exports = {
    umzug,
    sequelize
}
