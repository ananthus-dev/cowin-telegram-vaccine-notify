const {
    MONGO_USER,
    MONGO_PASSWORD,
    MONGO_DEFAULT_DATABASE,
    MONGO_HOSTNAME,
    ADMIN_USER_ID,
    BOT_TOKEN,
    CHECK_INTERVAL,
    COWIN_API_URL,
    MESSAGE_INTERVAL
} = process.env;

const MONGODB_URI =
    `mongodb+srv://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_HOSTNAME}/${MONGO_DEFAULT_DATABASE}?retryWrites=true&w=majority`;

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