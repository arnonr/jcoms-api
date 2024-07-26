
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const $table = "api_user";

// Middleware function for API authentication
async function authenticateApiKey(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: 'No authorization header provided' });
    }

    const [bearer, token] = authHeader.split(' ');

    if (bearer !== 'Bearer' || !token) {
        return res.status(401).json({ error: 'Invalid authorization header format' });
    }

    try {
        // Verify the token against the database using Prisma
        const user = await prisma[$table].findUnique({
        where: {
            api_key: token,
            is_active: 1
        }
        });

        if (!user) {
        return res.status(403).json({ error: 'Invalid or inactive API key' });
        }

        // If the API key is valid, attach the user info to the request object
        req.user = { id: user.id, username: user.username };

        next();
    } catch (error) {
        console.error('Database error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = authenticateApiKey;