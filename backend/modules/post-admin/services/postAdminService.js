const db = require("models/index");
const config = require("configs/index");
const { Sequelize, Op } = require("sequelize");
const { extractCoverImage } = require("utils/postUtils");

const postAdminService = {
  getPostList: async (
    categoryId,
    status,
    userId,
    languageId,
    limit = 5,
    page = 1,
    search = ""
  ) => {
    const offset = (page - 1) * limit;

    const options = {
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    };

    let where = {};

    if (search && search.trim() !== "") {
      const q = search.trim().toLowerCase();
      const escapeLike = (s) => s.replace(/[\\%_]/g, "\\$&");
      const likePattern = `%${escapeLike(q)}%`;
      where = {
        ...where,
        [Op.and]: [
          Sequelize.where(Sequelize.fn("LOWER", Sequelize.col("title")), {
            [Op.like]: likePattern,
          }),
        ],
      };
    }
    if (userId) {
      where = { ...where, userid: userId };
    }
    if (languageId) {
      where = { ...where, languageid: languageId };
    }
    if (status) {
      where = { ...where, status };
    }
    let categoryInclude = {
      model: db.Category,
      as: "Categories",
      attributes: ["categoryid", "categoryname"],
      through: { attributes: [] },
    };
    if (categoryId) {
      const catId = Number(categoryId);
      categoryInclude.where = { categoryid: catId };
      categoryInclude.required = true;
    }

    const { count, rows } = await db.Post.findAndCountAll({
      ...options,
      where,
      include: [
        { model: db.User, attributes: ["firstname", "lastname"] },
        {
          model: db.Language,
          attributes: ["languagename", "locale_code", "flag_image"],
        },
        categoryInclude,
      ],
      distinct: true,
    });

    return {
      posts: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
    };
  },
  getPostDetail: async (postId) => {
    const post = await db.Post.findByPk(postId, {
      include: [
        { model: db.User, attributes: ["firstname", "lastname", "avatar"] },
        {
          model: db.Language,
          attributes: ["languagename", "locale_code", "flag_image"],
        },
        {
          model: db.Category,
          as: "Categories",
          attributes: ["categoryid", "categoryname"],
          through: { attributes: [] },
        },
      ],
    });
    if (!post) {
      throw new Error("Post not found");
    }
    const postJSON = post.toJSON();
    postJSON.coverImage = extractCoverImage(postJSON.content);
    return postJSON;
  },
  approvePost: async (postId) => {
    const post = await db.Post.findByPk(postId);
    if (!post) {
      throw new Error("Post not found");
    }
    if (post.status === config.config.statuspostenum.APPROVED) {
      throw new Error("Post is already approved");
    }
    post.status = config.config.statuspostenum.APPROVED;
    return await post.save();
  },
  rejectPost: async (postId) => {
    const post = await db.Post.findByPk(postId);
    if (!post) {
      throw new Error("Post not found");
    }
    if (post.status === config.config.statuspostenum.REJECTED) {
      throw new Error("Post is already rejected");
    }
    post.status = config.config.statuspostenum.REJECTED;
    return await post.save();
  },
};

module.exports = postAdminService;
