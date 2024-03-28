const axios = require("axios");

const methods = {
    async onSendSms(req, res) {
        // console.log(req.body)
        let msisdn = req.body.msisdn;
        let message = req.body.message;

        if (msisdn == undefined) {
        return res.status(400).json({ msg: "msisdn is undefined" });
        }

        if (message == undefined) {
        return res.status(400).json({ msg: "message is undefined" });
        }

        try {
            let params = {
                msisdn: msisdn,
                message: message,
                sender: "Demo",
                force: "corporate",
                // Shorten_url: true,
                // tracking_url: true,
                // expire:
            };
            let auth = {
                username: process.env.SMS_USERNAME,
                password: process.env.SMS_PASSWORD,
            };

            const sms = await axios.post(
                `https://api-v2.thaibulksms.com/sms`,
                params,{
                    auth: auth,
                }
            );

            // console.log(sms.data);

            res.status(200).json({ ...params, msg: "success" });
        } catch (error) {
            res.status(400).json({ msg: error.message });
        }
    },
};

module.exports = { ...methods };
