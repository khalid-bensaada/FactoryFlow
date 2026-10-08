require('dotenv').config({ quiet: true });

const required = ['MONGO_URI', 'JWT_SECRET'];

for (const name of required) {
    if (!process.env[name]) {
        throw new Error(`Missing environment variable: ${name}`);
    }
}

module.exports = {
    PORT: process.env.PORT || 5000,
    MONGO_URI: process.env.MONGO_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1d',
};