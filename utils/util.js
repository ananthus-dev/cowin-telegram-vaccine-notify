const validator = require('validator');
const TelegramBot = require('node-telegram-bot-api');
const fetch = require('node-fetch');

const { CHECK_INTERVAL, MESSAGE_INTERVAL, BOT_TOKEN, ADMIN_USER_ID, COWIN_API_URL } = require('./constants');

const User = require("../models/user");
const Message = require('../models/mesage');

// const bot = new TelegramBot(BOT_TOKEN, { polling: true });
const bot = new TelegramBot(BOT_TOKEN);

const getUniqueItems = (itemsArray) => {
    return Array.from(new Set(itemsArray));
};

const getWelcomeMessage = (userName) => {
    let message = `Welcome ${userName}, \n\n`;
    message += `CoWIN - Vaccine Slot Notifier Bot allows you to register pincodes and notify you whenever vaccination slots are available at the provided locations. `;
    message += 'This uses CoWIN public API to get information about the availability of slots. \n\n';
    message += 'Please follow the instructions below to register or deregister pincodes.\n\n';
    message += `To register pincodes: \n\nType /add<space><pincodes separated by coma>\n`;
    message += `E.g   /add 686576,686754 \n\n`;
    message += `To deregister pincodes: \n\nType /remove<space><pincodes separated by coma>\n`;
    message += `E.g   /remove 686576,686754 \n\n\n`;
    message += `Thank You`;

    return message
}

const getJoiningMessageForAdmin = (userName) => {
    return `${userName} joined the Bot`;
}

const generateMessage = (center) => {
    let message = ``;
    message += `${center.name}\n`
    message += `${center.address}\n`
    message += `${center.block_name}\n`
    message += `${center.district_name}\n`
    message += `${center.state_name}\n`
    message += `${center.pincode}\n\n`

    message += `Fee Type: ${center.fee_type}\n\n`

    for (let session of center.sessions) {
        message += `Date: ${session.date}\n`
        message += `---------------------------\n`
        message += `Vaccine: ${session.vaccine}\n`
        message += `Minimum Age: ${session.min_age_limit}\n`
        message += `Dose 1 Capacity: ${session.available_capacity_dose1}\n`
        message += `Dose 2 Capacity: ${session.available_capacity_dose2}\n\n`
    };

    return message;
}

const onAddPinCode = (msg, match) => {

    try {

        if (!msg.from.is_bot) {
            let userId = msg.from.id,
                name = `${msg.from.first_name}`,
                pinCodes = getUniqueItems(match[1].split(',')),
                validPinCodes = [],
                invalidPinCodes = [],
                isNewUser = false;

            for (let pinCode of pinCodes) {
                if (validator.isPostalCode(pinCode, 'IN'))
                    validPinCodes.push(pinCode);
                else
                    invalidPinCodes.push(pinCode)
            }

            if (validPinCodes.length) {
                User.findOne({ userId: userId })
                    .then(user => {
                        if (user) {
                            return user.addPinCodes(validPinCodes)
                        }
                        else {
                            isNewUser = true;
                            const user = new User({
                                userId: userId,
                                name: name,
                                pinCodes: validPinCodes
                            });
                            return user.save().then((result) => {
                                console.info('NEW USER CREATED', '\n');
                                return Promise.resolve(validPinCodes);
                            })
                        }
                    })
                    .then(addedPinCodes => {
                        console.info('PINCODES ADDED SUCCESSFULLY', addedPinCodes, '\n');

                        let statusMessage = '';
                        if (addedPinCodes.length)
                            statusMessage += `Successfully added the following pincode(s): \n${addedPinCodes.reduce((acc, val) => (`${acc}\n${val}`), '')}`;
                        if (invalidPinCodes.length)
                            statusMessage += `\n\n\nPlease verify the following pincode(s) you have entered: \n${invalidPinCodes.reduce((acc, val) => (`${acc}\n${val}`), '')}`;

                        let message = statusMessage || 'You have already added the given pincode(s).'
                        bot.sendMessage(userId, message)
                            .then(val => {
                                console.info('PINCODE ADDITION CONFIRMATION SENT TO USER', '\n');
                            })
                            .catch(err => {
                                console.error('COULD NOT SEND PINCODE ADDITION CONFIRMATION TO USER', '\n', err.code, err.response.body, '\n');
                            })
                        if (isNewUser) {
                            bot.sendMessage(ADMIN_USER_ID, getJoiningMessageForAdmin(name))
                                .then(val => {
                                    console.info('NEW USER MESSAGE SENT TO ADMIN', '\n');
                                })
                                .catch(err => {
                                    console.error('FAILED TO SEND NEW USER MESSAGE TO ADMIN', '\n', err.code, err.response.body, '\n');
                                })
                        }
                    })
                    .catch(err => {
                        console.error('ERROR OCCURED WHILE ADDING PINCODES', '\n', err, '\n');
                        bot.sendMessage(userId, 'Some error occured while adding the pincodes.\nPlease try again later')
                            .then(val => {
                                console.info('PINCODE ADDITION FAILURE MESSAGE SENT TO USER');
                            })
                            .catch(err => {
                                console.error('COULD NOT SEND PINCODE ADDITION FAILURE MESSAGE TO USER', '\n', err.code, err.response.body, '\n');
                            });
                    })
            } else {
                let statusMessage = `Please verify the following pincode(s) you have entered: \n${invalidPinCodes.reduce((acc, val) => (`${acc}\n${val}`), '')}`;
                bot.sendMessage(userId, statusMessage)
                    .then(val => {
                        console.info('PINCODE VERIFICATION MESSAGE SENT TO USER');
                    })
                    .catch(err => {
                        console.error('COULD NOT SEND PINCODE VERIFICATION MESSAGE TO USER', '\n', err.code, err.response.body, '\n');
                    })
            }


        }
    }
    catch (err) {
        console.error('SOME ERROR OCCURED', '\n', err.code, err.response.body, '\n')
    }
}

const onRemovePinCode = (msg, match) => {
    try {
        if (!msg.from.is_bot) {
            const userId = msg.from.id,
                pinCodes = getUniqueItems(match[1].split(',')),
                validPinCodes = [],
                invalidPinCodes = [];

            for (let pinCode of pinCodes) {
                if (validator.isPostalCode(pinCode, 'IN'))
                    validPinCodes.push(pinCode);
                else
                    invalidPinCodes.push(pinCode)
            }

            if (validPinCodes.length) {
                User.findOne({ userId: userId })
                    .then(user => {
                        if (user) {
                            return user.removePinCodes(validPinCodes)
                        }
                        else {
                            return Promise.resolve([]);
                        }
                    })
                    .then(removedPinCodes => {
                        let message = '',
                            pinCodesNotAdded = validPinCodes.filter((code) => removedPinCodes.indexOf(code) == -1);

                        if (removedPinCodes.length)
                            message += `Successfully removed the following pincode(s): \n${removedPinCodes.reduce((acc, val) => (`${acc}\n${val}`), '')}`;

                        if (pinCodesNotAdded.length)
                            message += `\n\n\nYou haven't added the following pincodes: \n${pinCodesNotAdded.reduce((acc, val) => (`${acc}\n${val}`), '')}`;

                        if (invalidPinCodes.length)
                            message += `\n\n\nPlease verify the following pincode(s) you have entered: \n${invalidPinCodes.reduce((acc, val) => (`${acc}\n${val}`), '')}`;

                        bot.sendMessage(userId, message)
                            .then(val => {
                                console.info('PINCODE REMOVAL CONFIRMATION SENT TO USER', '\n');
                            })
                            .catch(err => {
                                console.error('COULD NOT SEND PINCODE REMOVAL CONFIRMATION TO USER', '\n', err.code, err.response.body, '\n');
                            })
                    })
                    .catch(err => {
                        console.error('ERROR OCCURED WHILE REMOVING PINCODES', '\n', err, '\n');
                    })
            } else if (invalidPinCodes.length) {
                let statusMessage = `Please verify the following pincode(s) you have entered: \n${invalidPinCodes.reduce((acc, val) => (`${acc}\n${val}`), '')}`;
                bot.sendMessage(userId, statusMessage)
                    .then(val => {
                        console.info('PINCODE VERIFICATION MESSAGE SENT TO USER');
                    })
                    .catch(err => {
                        console.error('COULD NOT SEND PINCODE VERIFICATION MESSAGE TO USER', '\n', err.code, err.response.body, '\n');
                    })
            }
        }
    }
    catch (err) {
        console.error('SOME ERROR OCCURED', '\n', err.code, err.response.body, '\n');
    }

}

const onStart = (msg, match) => {
    const userId = msg.from.id;
    User.findOne({ userId: userId })
        .then(user => {
            if (!user) {
                bot.sendMessage(userId, getWelcomeMessage(msg.from.first_name))
                    .then((val) => {
                        console.info(`WELCOME MESSAGE SENT TO ${msg.from.first_name}`, '\n');
                    })
                    .catch((err) => {
                        console.info(`COULD NOT SEND WELCOME MESSAGE TO ${msg.from.first_name}`, '\n', err, '\n');
                    })
            }
        })
}

let timeoutID;

const initializeTimer = ()=>{
    timeoutID = 0;
}

const clearTimer = () => {
    clearTimeout(timeoutID);
    timeoutID = null;
}

const checkSlotAvailability = async () => {

    if (timeoutID === null) return;

    let pinCodeUserMap = {},
        uniquePinCodes = [];
    try {
        const users = await User.find();
        users.forEach((user) => {
            user.pinCodes.forEach((pinCode) => {
                if (pinCodeUserMap.hasOwnProperty(pinCode)) {
                    pinCodeUserMap[pinCode].push(user);
                } else {
                    uniquePinCodes.push(pinCode);
                    pinCodeUserMap[pinCode] = [user]
                }
            })
        });
    }
    catch (err) {
        console.error('ERROR OCCURED WHILE FETCHING USER DATA', err, '\n');
        return;
    }

    if (!uniquePinCodes.length) {
        console.info('NO PINCODES HAVE BEEN ADDED !!!!!', '\n');

        if (timeoutID !== null)
            timeoutID = setTimeout(checkSlotAvailability, CHECK_INTERVAL);
        return;
    }

    console.info('========== CYCLE STARTED  ==========', new Date().toLocaleString(), '\n');

    for (let i = 0; i < uniquePinCodes.length; i++) {

        let [month, day, year] = new Date().toLocaleDateString().split('/');
        // let [day, month, year] = new Date().toLocaleDateString().split('/');
        if (+day < 10)
            day = '0' + day;
        if (+month < 10)
            month = '0' + month;
        const dateString = [day, month, year].join('-');

        const pinCode = uniquePinCodes[i];
        const url = `${COWIN_API_URL}?pincode=${pinCode}&date=${dateString}`;
        setTimeout(async () => {
            if (timeoutID === null) return;
            try {
                console.info('URL ---> ', url, '   Time ---> ', new Date().toLocaleString(), '\n');
                const response = await fetch(url, {
                    headers: {
                        'User-Agent': 'PostmanRuntime/7.28.0',
                        'Host': 'cdn-api.co-vin.in',
                        'Accept': '*/*',
                        'Cache-Control':'no-cache',
                        'Accept-Encoding':'gzip, deflate, br',
                        'Connection':'keep-alive'
                    }
                });
                const data = await response.json();

                const centers = data.centers || [];

                let filteredCenters = [];

                for (let center of centers) {
                    let sessions = [];
                    for (let session of center.sessions) {
                        if (+session.available_capacity > 0) {
                            let history = await Message.findOne({ centerId: center.center_id, sessionId: session.session_id });

                            if (!history || (history && (new Date() - history.lastSentTime) > MESSAGE_INTERVAL))
                                sessions.push(session);
                        }
                    }
                    if (sessions.length) {
                        filteredCenters.push({ ...center, sessions })
                    }
                }

                console.info('Pincode: ', pinCode, ' || ', 'Date: ', dateString, ' || ', 'All Centres: ', centers.length, ' || ', 'Filtereed Centres: ', filteredCenters.length, '\n');

                if (filteredCenters.length) {
                    for (let center of filteredCenters) {
                        let message = generateMessage(center);
                        for (let user of pinCodeUserMap[center.pincode]) {
                            try {
                                await bot.sendMessage(user.userId, message);
                                console.info(`MESSAGING SUCCESS FOR ${user.name}`, '\n');
                            }
                            catch (err) {
                                console.error(`MESSAGING FAILED FOR ${user.name}
                                ${err.code}
                                ${err.response.body}
                                `, '\n');
                            }
                        }
                        try {
                            for (let session of center.sessions) {
                                await Message.updateOne(
                                    {
                                        centerId: center.center_id,
                                        sessionId: session.session_id
                                    },
                                    {
                                        lastSentTime: new Date()
                                    },
                                    {
                                        upsert: true
                                    }
                                )
                            }
                            console.info(`SUCCESSFULLY UPDATED MESSAGES DB`, '\n');
                        }
                        catch (err) {
                            console.info(`FAILED TO UPDATE MESSAGES DB`, err, '\n');
                        }
                    }
                }

                if (i === uniquePinCodes.length - 1) {
                    console.info('========== CYCLE COMPLETED ==========', new Date().toLocaleString(), '\n');
                    if (timeoutID !== null)
                        timeoutID = setTimeout(checkSlotAvailability, CHECK_INTERVAL);
                }

            }
            catch (err) {
                console.error('API ERROR --->', err, '\n')
            }
        },
            CHECK_INTERVAL * i
        )
    }
}

module.exports = {
    bot,
    initializeTimer,
    clearTimer,
    onAddPinCode,
    onRemovePinCode,
    onStart,
    checkSlotAvailability
}