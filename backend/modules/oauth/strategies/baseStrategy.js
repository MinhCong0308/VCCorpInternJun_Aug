const db = require("models/index");
const { Op } = require("sequelize");
const config = require("configs/index");
const crypto = globalThis.crypto || require("node:crypto").webcrypto;
const nodemailer = require("nodemailer");
const oauthService = require("modules/oauth/services/oauthService");

class OAuthStrategy {
    constructor({ provider, ClassStrategy, config }) {
        this.provider = provider;
        this.ClassStrategy = ClassStrategy;
        this.config = config;
    }

    async verify(accessToken, refreshToken, profile, done) {
        try {
            // Pass this.provider to the service
            const result = await oauthService.handleOAuthSuccess(profile, this.provider);
            return done(null, result);
        } catch (error) {
            console.error(`[${this.provider} OAuth] Error:`, error);
            return done(error);
        }
    } 
    
    createStrategy() {
        return new this.ClassStrategy(
            this.config,
            this.verify.bind(this)
        );
    }
}

module.exports = {
    OAuthStrategy
};