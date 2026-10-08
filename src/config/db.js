const mongoose = require('mongoose');
const env = require('./env');

async function connectDB() {
    try {
        await mongoose.connect(env.MONGO_URI);
        console.log('MongDB connected');
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

module.exports = connectDB;