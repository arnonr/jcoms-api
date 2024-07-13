const express = require("express");
const router = express.Router();

const controllers = require("../../controllers/UserPermissionController");

router.get("/", controllers.onGetAll);
router.get("/:id", controllers.onGetById);

router.get("/get-by-user/:id", controllers.onGetByUserId);

router.post("/", controllers.onCreate);

router.put("/:id", controllers.onUpdate);

router.delete("/with-user-id/:id", controllers.onDeleteWithUserID);
router.delete("/:id", controllers.onDelete);



module.exports = router;
