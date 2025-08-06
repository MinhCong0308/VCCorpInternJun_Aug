require("express-router-group");
const express = require("express");
const middlewares = require("kernels/middlewares");
const {
  authenticated,
  checkRole,
} = require("kernels/middlewares/authMiddleware");
const { validate } = require("kernels/validations");
const exampleController = require("modules/examples/controllers/exampleController");
const authController = require("modules/auth/controllers/authController");
const authValidation = require("modules/auth/validations/authValidation");
const accountController = require("modules/user-account/controllers/accountController");
const accountValidation = require("modules/user-account/validations/accountValidation");
const postController = require("modules/post-owner/controllers/postController");
const postValidation = require("modules/post-owner/validations/postValidation");
const categoryValidation = require("modules/category/validations/categoryValidation");
const categoryController = require("modules/category/controllers/categoryController");
const languageController = require("modules/language/controllers/languageController");
const languageValidation = require("modules/language/validations/languageValidation");
const commentController = require("modules/comment/controllers/commentController");
const commentValidation = require("modules/comment/validations/commentValidation");
const postAdminController = require("modules/post-admin/controllers/postAdminController");
const userController = require("modules/user/controllers/userController");
const userValidation = require("modules/user/validations/userValidation");
const postsController = require("modules/post/controllers/postsController");
const router = express.Router({ mergeParams: true });
const oauthController = require("modules/oauth/controllers/oauthController");
const dashboardController = require("modules/dashboard/controllers/dashboardController");
const passport = require("modules/oauth/passport");
const { uploads } = require("kernels/middlewares/multer");
const multer = require("multer");

// ===== EXAMPLE Request, make this commented =====
// router.group("/posts",middlewares([authenticated, role("owner")]),(router) => {
//   router.post("/create",validate([createPostRequest]),postsController.create);
//   router.put("/update/:postId",validate([updatePostRequest]),postsController.update);
//   router.delete("/delete/:postId", postsController.destroy);
// }
// );

router.group("/example", validate([]), (router) => {
  router.get("/", exampleController.exampleRequest);
});
router.group("/auth", (router) => {
  router.post("/login", validate([authValidation.logIn]), authController.logIn);
  router.post(
    "/admin/login",
    validate([authValidation.logIn]),
    authController.logInAdmin
  );
  router.post(
    "/signup",
    validate([authValidation.signUp]),
    authController.signUp
  );
  router.post(
    "/validate-otp",
    validate([authValidation.verifyOTP]),
    authController.verifyOTP
  );
  router.group("/oauth", (router) => {
    router.get("/google", oauthController.loginWithGoogle);
    router.get(
      "/google/callback",
      passport.authenticate("google", {
        failureRedirect: "auth/login",
        session: false,
      }),
      oauthController.googleCallback
    );
  });
});
router.group("/account", middlewares([authenticated]), (router) => {
  router.post(
    "/update-username",
    validate([accountValidation.updateUsername]),
    accountController.updateUsername
  );
  router.post(
    "/update-fullname",
    validate([accountValidation.updateFullname]),
    accountController.updateFullname
  );
  router.post("/deactivate-account", accountController.deactivateAccount);
  router.post(
    "/update-avatar",
    uploads.single("avatar"),
    accountController.updateAvatar
  );
  router.get("/profile", accountController.getProfile);
});
router.group(
  "/post-owner",
  middlewares([authenticated, checkRole(["user"])]),
  (router) => {
    router.post(
      "/create-post",
      validate([postValidation.createPost]),
      postController.createPost
    );
    router.delete(
      "/delete-post",
      validate([postValidation.deletePost]),
      postController.deletePost
    );
    router.put(
      "/update-post",
      validate([postValidation.updatePost]),
      postController.updatePost
    );
    router.get("/get-all-posts", postController.getAllPosts);
    router.get(
      "/get-specific-post/:postid",
      postController.getSpecificPost
    );
  }
);

// ===== CATEGORY =====
router.group(
  "/categories",
  (router) => {
    router.get("/", categoryController.getAll);
    router.get("/list-all", categoryController.getAllNoPaging);
    router.post(
      "/",
      middlewares([authenticated, checkRole(["admin"])]),
      validate([categoryValidation.create]),
      categoryController.create
    );
    router.put(
      "/:categoryId",
      middlewares([authenticated, checkRole(["admin"])]),
      validate([categoryValidation.update]),
      categoryController.update
    );
    router.delete("/:categoryId", middlewares([authenticated, checkRole(["admin"])]), categoryController.delete);
  }
);

router.group(
  "/languages",
  (router) => {
    router.get("/", languageController.getAll);
    router.post(
      "/",
      middlewares([authenticated, checkRole(["admin"])]),
      uploads.single("flag_image"),
      validate([languageValidation.create]),
      languageController.create
    );
    router.put(
      "/:languageId",
      middlewares([authenticated, checkRole(["admin"])]),
      uploads.single("flag_image"),
      validate([languageValidation.update]),
      languageController.update
    );
    router.delete("/:languageId", middlewares([authenticated, checkRole(["admin"])]), languageController.delete);
  }
);

router.group("/comments", middlewares([authenticated, checkRole(["user"])]), (router) => {

  router.get("/", commentController.getAll);
  router.post(
    "/",
    validate([commentValidation.create]),
    commentController.create
  );
  router.put(
    "/:commentId",
    validate([commentValidation.update]),
    commentController.update
  );
});

router.group(
  "/post-admin",
  middlewares([authenticated, checkRole(["admin"])]),
  (router) => {
    router.get("/", postAdminController.getPostList);
    router.get("/:postId", postAdminController.getPostDetail);
    router.put("/:postId/approve", postAdminController.approvePost);
    router.put("/:postId/reject", postAdminController.rejectPost);
  }
);

// ===== POST =====
router.group("/posts", (router) => {
  router.get("/", postsController.getPublishedPosts);
  router.get("/trending", postsController.getPublishedPostsTrending);
  router.get("/:postId", postsController.getPublishedPostDetail);
  router.put("/:postId/like", middlewares([authenticated, checkRole(["user"])]), postsController.likePost);
  router.put("/:postId/unlike", middlewares([authenticated, checkRole(["user"])]), postsController.unlikePost);
});

router.group(
  "/users",
  middlewares([authenticated, checkRole(["admin"])]),
  (router) => {
    router.get("/", userController.getAll);
    router.post(
      "/",
      uploads.single("avatar"),
      validate([userValidation.create]),
      userController.create
    );
    router.put(
      "/:userid",
      uploads.single("avatar"),
      validate([userValidation.update]),
      userController.update
    );
    router.put("/:userid/disable", userController.disable);
    router.put("/:userid/enable", userController.enable);
  }
);

router.group(
  "/dashboard",
  middlewares([authenticated, checkRole(["admin"])]),
  (router) => {
    router.get("/", dashboardController.getDashboardData);
  }
);

module.exports = router;
