const app = require('./app');
const connectDB = require('./config/db');
const env = require('./config/env');

async function start() {
    await connectDB();
    app.listen(env.PORT, () => {
        console.log(`server works ${env.PORT}`);
    });
}

start();