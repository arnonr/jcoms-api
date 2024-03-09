const express = require("express");
const router = express.Router();

const controllers = require("../../controllers/UserController");
const auth = require("../auth");
// const { checkPermission } = require("../accessControl");

router.post("/login", controllers.onLogin);
router.post("/search-icit-account", controllers.onSearchIcitAccount);
router.get("/", controllers.onGetAll);
router.get("/:id", controllers.onGetById);

router.post(
  "/",
  // auth.required,
  controllers.onCreate
);

router.put(
  "/:id",
  // auth.required,
  controllers.onUpdate
);

router.delete(
  "/:id",
  //   auth.required,
  controllers.onDelete
);

module.exports = router;
