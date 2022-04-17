const mongoose = require('mongoose');

const ANSWERS = new mongoose.Schema({
    playerId: {
        type: Number,
        required: true
    },
    answer: {
        type: Object
    }
})


module.exports = mongoose.model('Answers', ANSWERS);