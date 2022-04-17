const mongoose = require('mongoose');

const ROOM = new mongoose.Schema({
    code: {
        type: String,
        required: true
    },
    maxPlayer: {
        type: Number,
        required: true
    },
    nbTurn: {
        type: Number,
        required: true
    }
})


module.exports = mongoose.model('Room', ROOM);