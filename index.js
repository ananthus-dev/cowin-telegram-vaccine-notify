
const express = require('express');
const mongoose = require('mongoose');

const { MONGODB_URI, PORT } = require('./utils/constants');

const { checkSlotAvailability, clearTimer,initializeTimer } = require('./utils/util');
const { onAddPinCode, onRemovePinCode, onStart, bot } = require('./utils/util.js');

const app = express();

app.use('/cowin/start', async (req, res) => {

    try {
        console.info('STARTING SERVICE', '\n');

        await bot.startPolling();

        console.info('STARTED TELEGRAM POLLING', '\n');

        bot.onText(/\/add (.+)/, onAddPinCode);

        bot.onText(/\/remove (.+)/, onRemovePinCode);

        bot.onText(/^\/start$/, onStart);
        
        initializeTimer();
        
        checkSlotAvailability();

        console.info('SERVICE STARTED', '\n');

        res.json({ 'Status': 'Started Service' });
    }
    catch (err) {
        console.error('SOME ERROR OCCURED WHILE STARTING THE SERVICE', '\n', err, '\n');
        res.json({ 'Status': 'Failed to start the service' });
    }
});

app.use('/cowin/stop', async (req, res) => {
    try {
        clearTimer();
        await bot.stopPolling();
        console.info('STOPPED TELEGRAM POLLING ', '\n');
        console.info('SERVICE STOPPED', '\n');
        res.json({ 'Status': 'Stopped' })
    }
    catch (err) {
        console.error('SOME ERROR OCCURED WHILE STOPPING THE SERVICE', '\n', err, '\n');
        res.json({ 'Status': 'Failed to stop the service' });
    }

})

mongoose
    .connect(MONGODB_URI)
    .then(result => {
        app.listen(process.env.PORT || PORT);
        console.info('\n', 'CONNECTED TO MONGO DB SERVER', '\n');
    })
    .catch(err => {
        console.error(err);
    });
