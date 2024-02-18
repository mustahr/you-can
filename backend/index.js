var mysql = require('mysql');
const express = require('express');
const cors = require('cors');
const { CronJob } = require('cron');

const app = express();
app.use(cors());
app.use(express.static('public'));

// Start the cron job
dailyJob.start();

// Handle requests
app.get('/', (req, res) => {
    res.send('Hello World!');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
