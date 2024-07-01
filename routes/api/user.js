const express = require("express");
const router = express.Router();

const { body, validationResult } = require('express-validator');

const controllers = require("../../controllers/UserController");

function getClientInfo(req) {
    return {
        ip: getClientIp(req),
        userAgent: req.headers['user-agent'] || 'Unknown'
    };
}

function getClientIp(req) {
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
        return forwardedFor.split(',')[0].trim();
    }
    return req.connection.remoteAddress || req.socket.remoteAddress || (req.connection.socket ? req.connection.socket.remoteAddress : null);
}

// Middleware to attach client info to the request object
router.use((req, res, next) => {
    req.clientInfo = getClientInfo(req);
    next();
});

const loginValidator = [
    body('email', 'Email does not Empty').not().isEmpty(),
    body('email', 'Invalid email').isEmail(),
    body('password', 'Password does not Empty').not().isEmpty(),
]

router.post('/login',
    loginValidator, (req, res, next) => {
        // req.clientIp = getClientIp(req);
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }
        next()
    },
    controllers.onLogin
);
// router.post("/login", controllers.onLogin);
router.get("/", controllers.onGetAll);
router.get("/:id", controllers.onGetById);

router.post("/register", controllers.onRegister);
router.post("/", controllers.onCreate);


// router.put("/:id", controllers.onUpdate);
router.post("/:id", controllers.onUpdate); /* POST method for Upload file */

router.delete("/:id", controllers.onDelete);

module.exports = router;
