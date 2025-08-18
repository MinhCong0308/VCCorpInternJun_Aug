const db = require("models/index");

const dashboardService = {
  getSummaryData: async () => {
    const [
      totalUsers,
      totalPosts,
      totalCategories,
      totalLanguages,
      latestUsers,
      latestPosts,
    ] = await Promise.all([
      db.User.count(),
      db.Post.count(),
      db.Category.count(),
      db.Language.count(),
      db.User.findAll({
        limit: 12,
        order: [["createdAt", "DESC"]],
        attributes: [
          "userid",
          "firstname",
          "lastname",
          "username",
          "avatar",
          "createdAt",
        ],
      }),
      db.Post.findAll({
        limit: 5,
        order: [["createdAt", "DESC"]],
        attributes: ["postid", "title", "content", "createdAt"],
        include: {
          model: db.User,
          attributes: ["userid", "username"],
        },
      }),
    ]);

    return {
      totals: {
        users: totalUsers,
        posts: totalPosts,
        categories: totalCategories,
        languages: totalLanguages,
      },
      latest_data: {
        users: latestUsers,
        posts: latestPosts,
      },
    };
  },
};

module.exports = dashboardService;
