"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateUserToken = generateUserToken;
const crypto_1 = require("crypto");
function generateUserToken() {
    return (0, crypto_1.randomBytes)(32)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}
//# sourceMappingURL=user-token.js.map