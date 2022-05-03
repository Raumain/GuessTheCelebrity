if(process.env.NODE_ENV !== 'production'){
  require('dotenv').config();
}

const express = require('express')
const app = express()
const path = require('path')
const fs = require('fs');
const server = require('http').Server(app)
const url = require('url')
const io = require('socket.io')(server, {
  cors: {
    origin: ["https://courageous-cobbler-2b76e5.netlify.app"]
  }
})

const Room = require('./models/room')
const Player = require('./models/players')
const Answer = require('./models/answers')

app.set('views', './views')
app.set('view engine', 'ejs')
app.set('io', io);
app.use(express.static(path.join(__dirname, 'public')))
app.use('/Images', express.static(path.join(__dirname, '/Images')))
app.use(express.urlencoded({ extended: true }))

const mongoose = require('mongoose');
mongoose.connect(process.env.DATABASE_URL, {useNewUrlParser: true, family: 4})
const db = mongoose.connection;
db.on('error', error => console.error(error));
// db.once('open', () => console.log("Connected to Mongoose !"));




const isEmpty = str => !str.trim().length;




app.get('/', (req, res) => {
  res.render('index')
})

app.get('/lobby', async (req, res) => {
  if(!verifNonNullParams(req.query.roomCode) || !verifNonNullParams(req.query.usernameOnJoin)){
    res.redirect(url.format({
      pathname: '/',
    }))
    return
  }
  else{
    try{
      var roomcode = req.query.roomCode
      var username = req.query.usernameOnJoin
      const checkRoom = await Room.find({code: roomcode})
      const playersInRoom = await Player.find({roomId: JSON.stringify(checkRoom[0]._id).split("\"")[1]})
      if(checkRoom[0].maxPlayer == playersInRoom.length){
        res.redirect(url.format({
          pathname: '/',
          query: {
            errorMessage: 'Room is full'
          }
        }))
        return
      }
      if(checkRoom != null && checkRoom != [] && checkRoom != ''){
        res.redirect(url.format({
          pathname: '/lobby/wait',
          query: {
            roomCode: roomcode,
            username: username,
            statut: 'player',
            maxPlayer: checkRoom[0].maxPlayer,
            nbTurn: checkRoom[0].nbTurn
          }
        }))
      }
    }
    catch{
      res.redirect(url.format({
        pathname: '/',
        query: {
          errorMessage: "error"
        }
      }))
      return
    }
  }
  
})

app.get('/lobby/wait', (req, res) => {
  if(!verifNonNullParams(req.query.roomCode) || !verifNonNullParams(req.query.username) || !verifNonNullParams(req.query.statut) || !verifNonNullParams(req.query.maxPlayer) || !verifNonNullParams(req.query.nbTurn) || rooms[req.query.roomCode] == undefined){
    res.redirect(url.format({
      pathname: '/',
    }))
    return
  }
  else{
    res.render('lobby', {roomCode: req.query.roomCode, username: req.query.username, status: req.query.statut, maxPlayer: req.query.maxPlayer, nbTurn: req.query.nbTurn})
  }
})

app.post('/lobby', async (req, res) => {
  if(!verifNonNullParams(req.body.usernameOnCreate) || !verifNonNullParams(req.body.maxPlayer) || !verifNonNullParams(req.body.nbTurn)){
    res.redirect('/')
    return
  }
  var roomcode = req.body.codeOnCreate
  var username = req.body.usernameOnCreate
  rooms[roomcode] = {users: {}}
  res.redirect(url.format({
    pathname: '/lobby/wait',
    query: {
      roomCode: roomcode,
      username: username,
      statut: 'host',
      maxPlayer: req.body.maxPlayer,
      nbTurn: req.body.nbTurn
    }
  }))
  
})

app.get('/game', async (req, res) => {
  var username = req.query.username
  if(!verifNonNullParams(req.query.roomcode) || !verifNonNullParams(req.query.username) || !verifNonNullParams(req.query.statut) || !verifNonNullParams(req.query.maxPlayer) || !verifNonNullParams(req.query.nbTurn) || !verifNonNullParams(req.query.nbPlayers) || rooms[req.query.roomcode] == undefined){
    res.redirect(url.format({
      pathname: '/',
    }))
    return
  }
  else{
    res.render('game', {username: username, roomcode: req.query.roomcode, statut: req.query.statut, maxPlayer: req.query.maxPlayer, nbTurn: req.query.nbTurn, nbPlayers: req.query.nbPlayers})
  }
})


app.get('/answers', async (req, res) => {
  if(!verifNonNullParams(req.query.roomcode) || !verifNonNullParams(req.query.username) || !verifNonNullParams(req.query.statut) || !verifNonNullParams(req.query.maxPlayer) || !verifNonNullParams(req.query.nbTurn) || !verifNonNullParams(req.query.nbPlayers) || !verifNonNullParams(req.query.id) || rooms[req.query.roomcode] == undefined){
    res.redirect(url.format({
      pathname: '/',
    }))
    return
  }
  else{
    res.render('answerPage', {id: req.query.id, username: req.query.username, roomcode: req.query.roomcode, statut: req.query.statut, maxPlayer: req.query.maxPlayer, nbTurn: req.query.nbTurn, nbPlayers: req.query.nbPlayers})
  }
})






server.listen(process.env.PORT || 3000)


var rooms = {}
// io.on('connection', socket => { 
//   console.log('Connecté !')
// })
 

const lobby = io.of('/lobby')
var nbPlayers = []
lobby.on('connection', socket => {

  socket.on('lobby-connect', async data =>{
    nbPlayers.push(data.username)
    socket.join(data.roomcode)
    rooms[data.roomcode].users[socket.id] = data.username
    if(rooms[data.roomcode] == undefined){
      return
    }
    rooms[data.roomcode].users[socket.id] = data.username
    saveRoom(data.roomcode, data.maxPlayer, data.nbTurn)
      .then(room =>{
        if(typeof data != String){
          savePlayer(data.username, room, 'host', socket)
          .then(async player=>{
            const room = await Room.find({code: data.roomcode})
            if(room.length == 0) return
            const playersInRoom = await Player.find({roomId: room[0]._id})
            var players = []
            for(let i = 0; i < playersInRoom.length; i++){
              players[i] = playersInRoom[i].name
            }
            lobby.to(data.roomcode).emit('display-name', {players: players})
            lobby.to(data.roomcode).emit('players-length', {nbPlayers: nbPlayers.length})
          })
        }
      })
  })

  socket.on('game-start', async data => {
    const room = await Room.find({code: data.roomcode})
    if(room.length == 0) return
    const playersInRoom = await Player.find({roomId: room[0]._id})
    let roomcode = data.roomcode
    lobby.to(roomcode).emit('game-starting', {users: data.users, roomcode: roomcode, nbPlayers: playersInRoom.length})
  })

  socket.on('send-message', data => {
    socket.broadcast.to(data.roomcode).emit('message-sent', {username: data.username, message: data.message})
    lobby.to(data.roomcode).emit('scroll')
  })
  
  socket.on('disconnecting', () => {
    nbPlayers = []
    disconnection(socket, socket.rooms, '', lobby)
  })

})



const verified = []
var playerAnswers = {}
var originalPhoto = {}
var editedPhoto = {}
const game = io.of('/game')
const answerIo = io.of('/answer')
var gameId = []
game.on('connection', socket => {

  socket.on('enter-game', data =>{
    socket.join(data.roomcode)
    rooms[data.roomcode].users[socket.id] = data.username
    playerAnswers[data.roomcode] = {users: {}}
    originalPhoto[data.roomcode] = {photos: []}
    editedPhoto[data.roomcode] = {photos: []}
    saveRoom(data.roomcode, data.maxPlayer, data.nbTurn)
    .then(room => {
      savePlayer(data.username, room, data.statut, socket)
      .then(player => {
        gameId.push(socket.id+' '+player._id)
        game.to(socket.id).emit('send-id', {id: JSON.stringify(player._id).split('"')[1]})
        var actualConnect = JSON.stringify(Object.keys(rooms[data.roomcode].users).length)
        game.to(data.roomcode).emit('actual-connections', {actualConnect: actualConnect})
      })
    })
    
  })

  socket.on('choose-photos', data => {
    const MontagesFolder = './Images/Montages';
    const allPhotos = []
    fs.readdir(MontagesFolder, (err, files) => {
      files.forEach(file => {
        allPhotos[allPhotos.length] = file
      });
      var inter = setInterval(() => {
        if(Object.keys(rooms[data.roomcode].users).length == data.nbPlayers){
          game.to(socket.id).emit('send-photos', {photos: allPhotos})
          clearInterval(inter)
        }
      }, 1000)
    })

    
  })
  
  socket.on('get-originals', data => {
    const OrginalFolder = './Images/Originales';
    var allOriginals = []
    fs.readdir(OrginalFolder, async (err, files) => {
      files.forEach(file => {
        allOriginals[allOriginals.length] = file
      });
      game.to(data.roomcode).emit('send-all-originals', {photos: allOriginals})
    });
  })

  socket.on('save-current-answer', async data => {
    var existingAnswer = [data.answer]
    const answer = await Answer.find({playerId: data.id})
    if(answer.length != 0){
      existingAnswer = answer[0].answers
      existingAnswer[existingAnswer.length] = data.answer
      await Answer.findOneAndUpdate({playerId: data.id}, {answers: existingAnswer}, {new: true})
    }
    else{
      var newAnswer = new Answer({
        playerId: data.id,
        answers : existingAnswer
      })
      await newAnswer.save()
    }
  })

  socket.on('send-chosen-photos', data =>{
    game.to(data.roomcode).emit('chosen-photos', {chosenPhotos: data.chosenPhotos})
  })

  socket.on('end-game', async data => {
    for(let i = 0; i < verified.length; i++){
      if(verified[i] == data.id){
        return
      }
    }
    verified[verified.length] = data.id
    const OrginalFolder = './Images/Originales';
    const allOriginals = []
    fs.readdir(OrginalFolder, async (err, files) => {
      files.forEach(file => {
        for(let i = 0; i < data.photos.length; i++){
          if(file == data.photos[i]){
            allOriginals[i] = file
          }
        }
      });
      const answer = await Answer.find({playerId: data.id})
      if(answer.length == 0) return
      game.to(data.roomcode).emit('send-originals', {photos: allOriginals})
      game.to(socket.id).emit('send-answers', {answers: answer[0].answers})
    });
  })


  socket.on('send-score', async data => {
    var id = new mongoose.Types.ObjectId(data.id)
    const player = await Player.findOneAndUpdate({_id: id}, {score: data.score}, {new: true})
    const answer = await Answer.findOne({playerId: data.id})
    playerAnswers[data.roomcode].users[socket.id] = {
      id: data.id,
      name: player.name,
      answers: answer.answers,
      correction: data.correction
    }
    originalPhoto[data.roomcode].photos = []
    editedPhoto[data.roomcode].photos = []
    originalPhoto[data.roomcode].photos = data.correctNames
    editedPhoto[data.roomcode].photos = data.chosenPhotos
    var actualConnect = JSON.stringify(Object.keys(playerAnswers[data.roomcode].users).length)
    if(actualConnect == data.nbPlayers){
      game.to(data.roomcode).emit('redirect')
    }
  })

  socket.on('disconnecting', () => {
    for(let i = 0; i < gameId.length; i++){
      var s = gameId[i].split(' ')[0]
      var id = gameId[i].split(' ')[1]
      if(s == socket.id){
        disconnection(socket, socket.rooms, id, answerIo)
      }
    }
  })
})

const scores = {}
const ids = []
answerIo.on('connection', socket => {
  
  socket.on('enter-answer', async data => {
    socket.join(data.roomcode)
    rooms[data.roomcode].users[socket.id] = data.username
    scores[data.roomcode] = {users: {}}
    ids.push(socket.id+' '+data.id)
    saveRoom(data.roomcode, data.maxPlayer, data.nbTurn)
    .then(room => {
      savePlayer(data.username, room, data.statut, socket)
      .then(player => {
        var actualConnect = JSON.stringify(Object.keys(rooms[data.roomcode].users).length)
        answerIo.to(data.roomcode).emit('wait-for-players', {actualConnect: actualConnect})
      })
    })

  })

  socket.on('get-answers', data => {
    answerIo.to(socket.id).emit('answers', {allAnswer: playerAnswers[data.roomcode], originalPhoto: originalPhoto, editedPhoto: editedPhoto})
  })

  socket.on('next', data => {
    socket.broadcast.to(data.roomcode).emit('next-photo', {i: data.i, j: data.j})
  })
  socket.on('previous', data => {
    socket.broadcast.to(data.roomcode).emit('previous-photo', {i: data.i, j: data.j})
  })

  socket.on('score', data => {
    scores[data.roomcode].users[socket.id] = {
      'name' : data.username,
      'score' : data.score
    }
  })
  
  socket.on('leaderboard', data => {
    answerIo.to(data.roomcode).emit('all-scores', {scores: scores[data.roomcode]})
  })
  socket.on('disconnect-everyone', () => {
    for(let i = 0; i < ids.length; i++){
      var s = ids[i].split(' ')[0]
      var id = ids[i].split(' ')[1]
      if(s == socket.id){
        disconnection(socket, socket.rooms, id, answerIo)
      }
    }
  })

  socket.on('disconnecting', () => {
    for(let i = 0; i < ids.length; i++){
      var s = ids[i].split(' ')[0]
      var id = ids[i].split(' ')[1]
      if(s == socket.id){
        disconnection(socket, socket.rooms, id, answerIo)
      }
    }
  })

})



async function disconnection(socket, socketRooms, id, namespace){
  var roomcode
  for(let room of socketRooms){
    if(room[room.length-1] == ' '){
      room = room.split(' ')[0]
    }
    if(room.length == 10){
      roomcode = room
      if(rooms[roomcode] == undefined){
        return
      }
      Object.keys(rooms[roomcode].users).forEach(uSocket =>{
        if(uSocket == socket.id){
          deleteUser(rooms[roomcode].users[uSocket], roomcode, uSocket, id, namespace)
        }
      })
    }
  }
}

async function deleteUser(user, roomcode, uSocket, id, namespace){
  if(user[user.length-1] == ' '){
    user = user.split(' ')[0]
  }
  
  try{
    var player = await Player.find({name: user, socketId: uSocket})
    var answers = await Answer.find({playerId: id})
    if(answers.length != 0)
    await answers[0].deleteOne()
    if(player.length != 0)
    await player[0].deleteOne()
  }
  catch{
    return
  }
  const room = await Room.find({code: roomcode})
  if(room.length == 0) return
  const playersInRoom = await Player.find({roomId: JSON.stringify(room[0]._id).split("\"")[1]})
  if(playersInRoom.length == 0){
    await room[0].deleteOne()
  }
  delete rooms[roomcode].users[uSocket]
  if(namespace.name == '/lobby'){
    var players = []
    for(let i = 0; i < playersInRoom.length; i++){
      players[i] = playersInRoom[i].name
    }
    lobby.to(roomcode).emit('display-name', {players: players})
  }
  return players
}


function verifNonNullParams(params){
  if(params == null || isEmpty(params) || params == '' || params == undefined){
    return false
  }
  return true
}


async function savePlayer(username, room, statut, socket){
  try{
    const player = new Player({
      roomId: room._id,
      socketId: socket.id,
      name: username,
      statut: statut,
    })
    await player.save()
    return player
  }
  catch{
    return "Could not save player "+username
  }
}

async function saveRoom(roomcode, maxPlayer, nbTurn){
  const room = await Room.findOneAndUpdate({code: roomcode}, {code: roomcode, maxPlayer: maxPlayer, nbTurn: nbTurn}, {new: true, upsert: true})
  return room
}
