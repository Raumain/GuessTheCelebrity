const mongoose = require('mongoose');

const ANSWERS = new mongoose.Schema({
    playerId: {
        type: String,
        required: true
    },
    answers: {
        type: Array
    }
})


module.exports = mongoose.model('Answers', ANSWERS);