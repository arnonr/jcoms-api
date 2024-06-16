const crypto = require('crypto');
// const key = "secretkey123";
const methods = {
    // Function to encode a string to Base64 with a key
    base64EncodeWithKey(str) {
        const key = process.env.BASE64_KEY;
        const keyRepeated = key.repeat(Math.ceil(str.length / key.length)).slice(0, str.length);
        const encodedStr = Buffer.from(str.split('').map((char, i) =>
            char.charCodeAt(0) ^ keyRepeated.charCodeAt(i % keyRepeated.length)
        ));
        return encodedStr.toString('base64');
    },

    base64DecodeWithKey(encodedStr) {
        const key = process.env.BASE64_KEY;
        const buff = Buffer.from(encodedStr, 'base64');
        const keyRepeated = key.repeat(Math.ceil(buff.length / key.length)).slice(0, buff.length);
        const buffDecoded = buff.map((char, i) =>
            char ^ keyRepeated.charCodeAt(i % keyRepeated.length)
        );

        return String.fromCharCode(...buffDecoded);
    },
};

module.exports = { ...methods };
