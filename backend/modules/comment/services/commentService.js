const db = require('models/index');

const commentService = {
    getCommentsByPost: async (postId) => {
        // Lấy toàn bộ comment của post, order by lft (dạng phẳng)
        const comments = await db.Comment.findAll({
            where: { postId },
            include: [{ model: db.User, attributes: ['userid', 'username', 'avatar'] }],
            order: [['lft', 'ASC']]
        });
        return comments;
    },
    createComment: async (commentData) => {
        // commentData: { postId, userId, content, parentId }
        const { postId, parentId } = commentData;
        if (!postId) throw new Error("Missing postId");

        // Nếu là bình luận gốc
        if (!parentId) {
            // Tìm max rgt của các comment cùng post
            const maxRgt = await db.Comment.max('rgt', { where: { postId } });
            const lft = (maxRgt || 0) + 1;
            const rgt = lft + 1;
            return await db.Comment.create({ ...commentData, lft, rgt });
        } else {
            // Bình luận con: cần cập nhật lft/rgt các node liên quan
            const parent = await db.Comment.findOne({ where: { id: parentId, postId } });
            if (!parent) throw new Error("Parent comment not found");
            const lft = parent.rgt;
            const rgt = lft + 1;
            // Cập nhật lft/rgt các node bên phải
            await db.Comment.update(
                { rgt: db.sequelize.literal('rgt + 2') },
                { where: { postId, rgt: { [db.Sequelize.Op.gte]: lft } } }
            );
            await db.Comment.update(
                { lft: db.sequelize.literal('lft + 2') },
                { where: { postId, lft: { [db.Sequelize.Op.gt]: lft } } }
            );
            return await db.Comment.create({ ...commentData, lft, rgt });
        }
    },
    updateComment: async (commentId, commentData) => {
        // Không cho phép đổi parentId, postId khi update
        const comment = await db.Comment.findByPk(commentId);
        if (!comment) {
            throw new Error("Comment not found");
        }
        // Xoá parentId, postId nếu có trong commentData
        const { parentId, postId, ...rest } = commentData;
        return await comment.update(rest);
    }
}

module.exports = commentService;