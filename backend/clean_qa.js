require('dotenv').config();
const connectDB = require('./config/db');
const Notification = require('./models/Notification');

const cleanDb = async () => {
    try {
        await connectDB();
        await Notification.deleteMany({ title: /QA/i });
        console.log('Test notifications dropped successfully.');
        process.exit(0);
    } catch(err) {
        console.error(err);
        process.exit(1);
    }
};
cleanDb();
