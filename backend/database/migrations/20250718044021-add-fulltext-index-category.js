"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addIndex("category", ["categoryname"], {
      type: "FULLTEXT",
      name: "idx_category_name",
    });
    await queryInterface.addIndex("language", ["languagename"], {
      type: "FULLTEXT",
      name: "idx_language_name",
    });
    await queryInterface.addIndex("user", ["firstname"], {
      type: "FULLTEXT",
      name: "idx_first_name",
    });
    await queryInterface.addIndex("user", ["lastname"], {
      type: "FULLTEXT",
      name: "idx_last_name",
    });
    await queryInterface.addIndex("user", ["username"], {
      type: "FULLTEXT",
      name: "idx_user_name",
    });
    await queryInterface.addIndex("user", ["email"], {
      type: "FULLTEXT",
      name: "idx_email",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex("category", "idx_category_name");
    await queryInterface.removeIndex("language", "idx_language_name");
    await queryInterface.removeIndex("user", "idx_first_name");
    await queryInterface.removeIndex("user", "idx_last_name");
    await queryInterface.removeIndex("user", "idx_user_name");
    await queryInterface.removeIndex("user", "idx_email");
  },
};
