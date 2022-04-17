const mongoose = require('mongoose');

const PLAYER = new mongoose.Schema({
    roomId: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    statut: {
        type: String,
        required: true
    },
    score: {
        type: Number,
    }
})

module.exports = mongoose.model('Player', PLAYER);