const db = require("models/index");

const categoryService = {
  getAllCategories: async (limit = 5, page = 1, search = "") => {
    const offset = (page - 1) * limit;
    const options = {
      limit,
      offset,
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: db.Post,
          as: "Posts",
          attributes: [],
          through: { attributes: [] },
        },
      ],
      attributes: {
        include: [
          [
            db.sequelize.literal(
              "(SELECT COUNT(*) FROM category_post WHERE category_post.categoryid = Category.categoryid)"
            ),
            "totalPost",
          ],
        ],
      },
      group: ["Category.categoryid"],
    };

    if (search && search.trim() !== "") {
      options.where = db.sequelize.literal(
        `MATCH(categoryname) AGAINST('${search.trim()}' IN NATURAL LANGUAGE MODE)`
      );
    }

    const totalCount = await db.Category.count({
      where: options.where,
    });

    const { rows } = await db.Category.findAndCountAll(options);

    return {
      categories: rows,
      total: totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit),
    };
  },
  getAllNoPaging: async () => {
    const categories = await db.Category.findAll({
      attributes: ["categoryid", "categoryname"],
      order: [["categoryname", "ASC"]],
    });
    return categories;
  },
  createCategory: async (categoryData) => {
    const name = (categoryData.categoryname || "").trim();
    if (!name) {
      throw new Error("Category name is required");
    }
    const existed = await db.Category.findOne({
      where: db.sequelize.where(
        db.sequelize.fn("LOWER", db.sequelize.col("categoryname")),
        name.toLowerCase()
      ),
    });
    if (existed) {
      throw new Error("Category name already exists");
    }
    return await db.Category.create({ ...categoryData, categoryname: name });
  },
  updateCategory: async (categoryId, categoryData) => {
    const category = await db.Category.findByPk(categoryId);
    if (!category) {
      throw new Error("Category not found");
    }
    try {
      if (categoryData.categoryname) {
        const name = categoryData.categoryname.trim();
        const existed = await db.Category.findOne({
          where: {
            categoryname: name,
          },
        });
        if (existed && existed.categoryid !== category.categoryid) {
          throw new Error("Category name already exists");
        }
        categoryData.categoryname = name;
      }
      return await category.update(categoryData);
    } catch (error) {
      throw new Error("Failed to update category: " + error.message);
    }
  },
  deleteCategory: async (categoryId) => {
    const category = await db.Category.findByPk(categoryId);
    if (!category) {
      throw new Error("Category not found");
    }
    await category.destroy();
  },
};

module.exports = categoryService;
