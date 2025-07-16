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
const router = express.Router({ mergeParams: true });

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
});
module.exports = router;
