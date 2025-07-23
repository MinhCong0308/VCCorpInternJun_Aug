require("express-router-group");
const express = require("express");
const middlewares = require("kernels/middlewares");
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
const router = express.Router({ mergeParams: true });
const oauthController = require("modules/oauth/controllers/oauthController");
const passport = require("modules/oauth/passport");
const {uploads} = require("kernels/middlewares/multer")

// ===== EXAMPLE Request, make this commented =====
// router.group("/posts",middlewares([authenticated, role("owner")]),(router) => {
//   router.post("/create",validate([createPostRequest]),postsController.create);
//   router.put("/update/:postId",validate([updatePostRequest]),postsController.update);
//   router.delete("/delete/:postId", postsController.destroy);
// }
// );

router.group("/example", validate([]), (router) => {
  router.get('/', exampleController.exampleRequest)
})
router.group("/auth", (router) => {
  router.post("/login", validate([authValidation.logIn]), authController.logIn);
  router.post("/signup", validate([authValidation.signUp]), authController.signUp);
  router.post("/validate-otp", validate([authValidation.verifyOTP]), authController.verifyOTP);
  router.group("/oauth", (router) => {
    router.get("/google", oauthController.loginWithGoogle);
    router.get("/google/callback", passport.authenticate("google", {failureRedirect: "auth/login", session: false}), oauthController.googleCallback);
  });
});
router.group("/account", (router) => {
  router.post("/update-username", validate([accountValidation.updateUsername]), accountController.updateUsername);
  router.post("/update-fullname", validate([accountValidation.updateFullname]), accountController.updateFullname);
  router.post("/deactivate-account", accountController.deactivateAccount);
});
router.group("/post-owner", (router) => {
  router.post("/create-post", validate([postValidation.createPost]), postController.createPost);
  router.delete("/delete-post", validate([postValidation.deletePost]), postController.deletePost);
  router.put("/update-post", validate([postValidation.updatePost]), postController.updatePost);
  router.get("/get-all-posts", postController.getAllPosts);
});

// ===== CATEGORY =====
//middlewares([middlewares.authenticated, middlewares.role("admin")])
router.group("/categories", (router) => {
  router.get("/", categoryController.getAll);
  router.get("/list-all", categoryController.getAllNoPaging);
  router.post("/", validate([categoryValidation.create]), categoryController.create);
  router.put("/:categoryId", validate([categoryValidation.update]), categoryController.update);
  router.delete("/:categoryId", categoryController.delete);
});

// ===== LANGUAGE =====
//middlewares([middlewares.authenticated, middlewares.role("admin")])
router.group("/languages", (router) => {
  router.get("/", languageController.getAll);
  router.post("/",uploads.single('flag_image'), validate([languageValidation.create]), languageController.create);
  router.put("/:languageId",uploads.single('flag_image'), validate([languageValidation.update]), languageController.update);
  router.delete("/:languageId", languageController.delete);
});

// ===== COMMENT =====
router.group("/comments", (router) => {
  router.get("/", commentController.getAll);
  router.post("/", validate([commentValidation.create]), commentController.create);
  router.put("/:commentId", validate([commentValidation.update]), commentController.update);
});

module.exports = router;
