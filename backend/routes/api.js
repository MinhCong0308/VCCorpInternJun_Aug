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
const dictionaryController = require("modules/dictionary/controllers/dictionaryController");
const dictionaryValidation = require("modules/dictionary/validations/dictionaryValidation");
const router = express.Router({ mergeParams: true });
const oauthController = require("modules/oauth/controllers/oauthController");
const dashboardController = require("modules/dashboard/controllers/dashboardController");
const passport = require("modules/oauth/passport");
const manageTokenController = require("modules/manage_token/controllers/manageTokenController");
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
  router.get(
    "/me",
    middlewares([authenticated]),
    authController.getSessionInfo
  );
  router.post("/logout", middlewares([authenticated]), authController.logout);
  router.post("/refresh", manageTokenController.refreshToken);
  router.post("/change-password", middlewares([authenticated]), authController.changePassword);
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
  router.put(
    "/update-username",
    validate([accountValidation.updateUsername]),
    accountController.updateUsername
  );
  router.put(
    "/update-fullname",
    validate([accountValidation.updateFullname]),
    accountController.updateFullname
  );
  router.put("/deactivate-account", accountController.deactivateAccount);
  router.put(
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
    router.delete("/delete-post/:postid", postController.deletePost);
    router.put(
      "/update-post",
      validate([postValidation.updatePost]),
      postController.updatePost
    );
    router.get("/get-all-posts", postController.getAllPosts);
    router.get("/get-all-posts-paging", postController.getAllPostsPaging);
    router.get("/get-specific-post/:postid", postController.getSpecificPost);
    router.get(
      "/get-translation-for-post/:postid",
      postController.getTranslationForPost
    );
    router.post(
      "/translate",
      validate([postValidation.translatePost]),
      postController.translatePost
    );
    router.post("/appeal/:postid", postController.appealForRejectedText);
  }
);

// ===== CATEGORY =====
router.group("/categories", (router) => {
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
  router.delete(
    "/:categoryId",
    middlewares([authenticated, checkRole(["admin"])]),
    categoryController.delete
  );
});

router.group("/languages", (router) => {
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
  router.put(
    "/:languageId/disable",
    middlewares([authenticated, checkRole(["admin"])]),
    languageController.disable
  );
  router.put(
    "/:languageId/enable",
    middlewares([authenticated, checkRole(["admin"])]),
    languageController.enable
  );
});

router.group("/comments", (router) => {
  router.get("/", commentController.getAll);
  router.post(
    "/",
    middlewares([authenticated, checkRole(["user"])]),
    validate([commentValidation.create]),
    commentController.create
  );
  router.put(
    "/:commentId",
    middlewares([authenticated, checkRole(["user"])]),
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
  router.put(
    "/:postId/like",
    middlewares([authenticated, checkRole(["user"])]),
    postsController.likePost
  );
  router.put(
    "/:postId/unlike",
    middlewares([authenticated, checkRole(["user"])]),
    postsController.unlikePost
  );
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
    router.put("/:userid/change-role", userController.changeRole);
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

// ===== ADMIN DICTIONARY (Bad Words) =====
router.group(
  "/dictionary",
  middlewares([authenticated, checkRole(["admin"])]),
  (router) => {
    router.get("/", dictionaryController.getAll);
    router.get("/locales", dictionaryController.locales);
    router.post(
      "/",
      validate([dictionaryValidation.create]),
      dictionaryController.create
    );
    router.put("/:wordid/enable", dictionaryController.enable);
    router.put("/:wordid/disable", dictionaryController.disable);
    router.delete("/:wordid", dictionaryController.delete);
    // bulk delete removed
  }
);

module.exports = router;
