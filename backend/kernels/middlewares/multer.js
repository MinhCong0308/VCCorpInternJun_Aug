const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let destPath = "";

    if (req.originalUrl.includes("/languages")) {
      destPath = path.join(__dirname, "../../uploads/flags");
    } else if (req.originalUrl.includes("/users")) {
      destPath = path.join(__dirname, "../../uploads/avatars");
    } else {
      destPath = path.join(__dirname, "../../uploads/others");
    }
    cb(null, destPath);
  },

  filename: (req, file, cb) => {
    cb(null, Date.now() + "_" + file.originalname);
  },
});

const uploads = multer({ storage: storage });
module.exports = { uploads };
