// src/middleware/customRateLimiter.js

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const $table = "api_user";

const COST_PER_REQUEST = 1; // Cost of each API call
const REGEN_RATE = 1000 / 3600; // Regeneration rate per second (1 point per hour (1/3600))

const customRateLimiter = async (req, res, next) => {
    try {
        const userId = req.user.id;

        // Fetch user and update allowance
        const user = await updateUserAllowance(userId);

        if (user.rate_limit_allowance < COST_PER_REQUEST) {
        const secondsUntilReset = Math.ceil((COST_PER_REQUEST - user.rate_limit_allowance) / REGEN_RATE);
        return res.status(429).json({
            error: 'Rate limit exceeded',
            retryAfter: secondsUntilReset
        });
        }

        // Deduct the cost of this request
        await deductAllowance(userId, COST_PER_REQUEST);

        next();
    } catch (error) {
        console.error('Rate limiting error:', error);
        next(error);
    }
    };

    async function updateUserAllowance(userId) {
    const now = new Date();

    const user = await prisma[$table].findUnique({
        where: { id: userId },
        select: {
            rate_limit_per_hour: true,
            rate_limit_allowance: true,
            last_request_time: true
        }
    });

    if (!user) {
        throw new Error('User not found');
    }

    const elapsedSeconds = Math.floor((now - user.last_request_time) / 1000);
    const regeneratedAllowance = Math.floor(elapsedSeconds * REGEN_RATE);

    const newAllowance = Math.min(
        user.rate_limit_per_hour,
        user.rate_limit_allowance + regeneratedAllowance
    );

    return prisma[$table].update({
        where: { id: userId },
        data: {
        rate_limit_allowance: newAllowance,
        last_request_time: now
        }
    });
    }

    async function deductAllowance(userId, cost) {
    await prisma[$table].update({
        where: { id: userId },
        data: {
        rate_limit_allowance: {
            decrement: cost
        }
        }
    });
}

module.exports = customRateLimiter;