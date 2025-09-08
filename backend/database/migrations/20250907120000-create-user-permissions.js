'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('user_permissions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userid: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'user',
          key: 'userid'
        },
        onDelete: 'CASCADE'
      },
      can_write_post: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      can_like_post: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      can_write_comment: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      can_edit_comment: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('user_permissions');
  }
};
