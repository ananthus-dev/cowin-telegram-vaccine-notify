const MONGODB_URI =
    'mongodb+srv://ananthu:node-complete@node-complete.wvv4x.mongodb.net/cowin?retryWrites=true&w=majority';
const ADMIN_USER_ID = 440475609;
const BOT_TOKEN = '1712425933:AAHl5jDh-j67juFsf4DNoM-aP3UwZyklcAA';

const MY_PINCODES = [
    686502,
    686503,
    686504,
    686506,
    686507,
    686508,
    686512,
    686518,
    686519,
    686522,
    686540,
    686541,
    686542,
    686543,
    686544,
    686577,
    686584
];

const CHECK_INTERVAL = 10000;

const COWIN_API_URL = 'https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByPin';

const MESSAGE_INTERVAL = 7200000; //2 hrs

const PORT = 3000;

const PINCODE_ADD_REGEX = new RegExp(/\/add (.+)/);
const PINCODE_REMOVE_REGEX = new RegExp(/\/remove (.+)/);
const START_REGEX = new RegExp(/^\/start$/);

module.exports = {
    MONGODB_URI,
    ADMIN_USER_ID,
    BOT_TOKEN,
    MY_PINCODES,
    COWIN_API_URL,
    CHECK_INTERVAL,
    MESSAGE_INTERVAL,
    PORT,
    PINCODE_ADD_REGEX,
    PINCODE_REMOVE_REGEX,
    START_REGEX
}