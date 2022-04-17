if(process.env.NODE_ENV !== 'production'){
  require('dotenv').config();
}

const express = require('express')
const expressLayouts = require('express-ejs-layouts')
const app = express()
const server = require('http').Server(app)
const url = require('url')
const io = require('socket.io')(server, {
  cors: {
    origin: ["http://localhost:3000"]
  }
})

const Room = require('./models/room')
const Player = require('./models/players')
const ANSWERS = require('./models/answers')

app.set('views', './views')
app.set('view engine', 'ejs')
// app.set('layout', 'layouts/layout');
// app.use(expressLayouts); 
app.set('io', io);
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))

const mongoose = require('mongoose');
mongoose.connect(process.env.DATABASE_URL, {useNewUrlParser: true, family: 4})
const db = mongoose.connection;
db.on('error', error => console.error(error));
db.once('open', () => console.log("Connected to Mongoose !"));


function generateCode(){
  var code = ''
  var alphabet = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z']
  for(let i = 0; i < 10; i++){
    code += alphabet[Math.floor(Math.random()*alphabet.length)]
  }
  return code
}

const rooms = {}


app.get('/', (req, res) => {
  res.render('index')
})

app.get('/lobby', async (req, res) => {
  if(req.query.roomCode == null && req.query.roomCode == ''){
    res.render('/index', {errorMessage: "Rentrez le code de la partie à rejoindre"})
    return
  }
  else if(req.query.usernameOnJoin == null && req.query.usernameOnJoin == ''){
    res.render('/index', {errorMessage: "Rentrez un pseudo"})
    return
  }
  else{
    try{
      const checkRoom = await Room.find({code: req.query.roomCode})
      if(checkRoom != null && checkRoom != [] && checkRoom != ''){
        const player = new Player({
          roomId: checkRoom[0]._id,
          name: req.query.usernameOnJoin,
          statut: 'player',
        })
        try{
          const savePlayer = await player.save()
          res.redirect(url.format({
            pathname: '/lobby/wait',
            query: {
              roomCode: req.query.roomCode,
              username: req.query.usernameOnJoin
            }
          }))
        }
        catch{
          res.redirect('/')
          console.log('fail saving player')
        }
      }
      else{
        res.redirect('/')
      }
    }
    catch{
      res.render('index', {errorMessage: "Impossible de rejoindre la partie (Code inexistant ou erroné)"})
    }
  }
  
})

app.get('/lobby/wait', (req, res) => {
  res.render('lobby', {roomCode: req.query.roomCode, username: req.query.username})
})

app.post('/lobby', async (req, res) => {
  const code = generateCode()
  
  const room = new Room({
    code: code,
    maxPlayer: req.body.maxPlayer,
    nbTurn: req.body.nbTurn
  })
  const player = new Player({
    roomId: room._id,
    name: req.body.usernameOnCreate,
    statut: 'host',
  })
  console.log(player)
  try{
    const saveRoom = await room.save()
    try{
      const savePlayer = await player.save()
      res.redirect(url.format({
        pathname: '/lobby/wait',
        query: {
          roomCode: saveRoom.code,
          username: req.body.usernameOnCreate
        }
      }))
    }
    catch{
      res.redirect('/')
      console.log('fail saving player')
    }
  }
  catch{
    res.redirect('/')
    console.log('fail saving room')
  }
})

app.get('/game/:params', (req, res) => {
  res.send("ok")
})




server.listen(3000)



io.on('connection', socket => { 
  console.log('Connecté !')

  socket.on('send-message', data => {
    socket.broadcast.emit('message-sent', {username: data.username, message: data.message})
  })

  socket.on('include-in-room', data => {
    console.log(data)
  })

 

})
