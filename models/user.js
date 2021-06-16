const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
    userId: {
        type: Schema.Types.String,
        required: true,
    },
    name: {
        type: Schema.Types.String,
        required: true
    },
    pinCodes: [
        {
            type: Schema.Types.String
        }
    ]
});

userSchema.methods.addPinCodes = function (pinCodes) {
    let existingPinCodes = this.pinCodes || [];
    let uniquePinCodes = pinCodes.filter((code) => existingPinCodes.indexOf(code) == -1);
    this.pinCodes.push(...uniquePinCodes);
    return this.save().then(result => {
        return Promise.resolve(uniquePinCodes);
    })
}

userSchema.methods.removePinCodes = function (pinCodes) {
    // let existingPinCodes = (this.pinCodes || []).map((code) => code.code);
    let toBeRemoved = [];
    for (let pinCode of pinCodes) {
        let index = this.pinCodes.findIndex((pCode) => pCode === pinCode);
        if (index > -1) {
            toBeRemoved.push(pinCode);
            this.pinCodes.splice(index, 1);
        }
    }
    return this.save().then(result=>{
        return Promise.resolve(toBeRemoved)
    })
}


module.exports = mongoose.model('User', userSchema);