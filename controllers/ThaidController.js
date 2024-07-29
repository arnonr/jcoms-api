const prisma_config = require('../config/prismaClient');
const prisma = prisma_config;

const axios = require("axios");


const methods = {
    async tokenRequest(req, res) {
        if (!req.query.code) {
            return res.status(400).json({ msg: "Code is required" });
        }

        const code = req.query.code;

        try {
            const headers = {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: "Basic " + Buffer.from(
                    `${process.env.THAID_CLIENTID}:${process.env.THAID_CLIENT_SECRET}`
                ).toString('base64'),
            };

            const response = await axios.post(
                "https://imauth.bora.dopa.go.th/api/v2/oauth2/token/",
                {
                    grant_type: "authorization_code",
                    redirect_uri: process.env.THAID_REDIRECT_URI,
                    code: code,
                },
                { headers: headers }
            );

            // Assuming the token is in the response data
            // const token = response.data.access_token;
            const token = response.data;
            // console.log("Token:", response);
            const data = {
                "pid": token.pid,
                "name": token.name,
                "birthdate": token.birthdate,
                "address": token.address,
                "given_name": token.given_name,
                "family_name": token.family_name,
                "middle_name": token.middle_name,
                "gender": token.gender,
                "titleTh": token.titleTh,
            };

            return res.status(200).json({
                data: data,
                msg: "success",
            });

        } catch (error) {
            // console.error("Token request error:", error.response ? error.response.data : error.message);

            return res.status(error.response ? error.response.status : 500).json({
                msg: "Error retrieving token",
                error: error.response ? error.response.data : error.message
            });
        }
    },

};

module.exports = { ...methods};
