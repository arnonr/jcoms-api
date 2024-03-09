const express = require("express");
const router = express.Router();
const auth = require("../auth");

const controllers = require("../../controllers/AssetController");

router.get("/", controllers.onGetAll);
router.get("/report", controllers.onGetReport);
router.get("/export", controllers.onGetExport);
router.get("/:id", controllers.onGetById);
router.post("/import-asset", controllers.onImportAsset);
router.post("/", controllers.onCreate);

router.post("/:id", auth.required, controllers.onUpdate);

router.delete("/:id", controllers.onDelete);

module.exports = router;
