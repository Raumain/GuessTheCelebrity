const socket = io('https://guess-the-celebrity1.herokuapp.com')
const lobby = io('/lobby')

var messageContainer = document.getElementById('chat-box')
var messageForm = document.getElementById('message-form')
var message = document.getElementById('message')
var waitingPlayers = document.querySelector('.waiting-players')
var code = document.querySelector('.room-code h1')
var pop = document.querySelector('.popup')
var start = document.getElementById('start')
var hide = document.querySelector('.hide')
var id = ''
var nbPlayers

console.info(performance.getEntriesByType("navigation")[0].type );
if (performance.getEntriesByType("navigation")[0].type ==  'reload' || performance.getEntriesByType("navigation")[0].type ==  'back_forward') {
  console.info( "This page is reloaded" );
  window.location.assign('https://guess-the-celebrity1.herokuapp.com')
} 
const isEmpty = str => !str.trim().length;


code.addEventListener('click', () => {
    navigator.clipboard.writeText(code.innerHTML);
    pop.style.display = "block"
    setTimeout(() => {
      pop.style.display = "none";
    },1500);
})

messageForm.addEventListener('submit', (e) => {
    e.preventDefault()
    if(message.value != null && message.value != '' && !isEmpty(message.value)){
        lobby.emit('send-message', {username: username, message: message.value, roomcode: roomCode})
        appendMessage(message.value, 'outgoing-message', '')
        message.value = ''
    }
})
if(host == 'host'){
    start.addEventListener('click', () => {
        var players = document.querySelectorAll('.player')
        var users = []
        players.forEach(player => {
            users[users.length] = player.innerHTML
        })
        lobby.emit('game-start', {users: users, roomcode: roomCode})
    })
}

lobby.on('players-length', data => {
    nbPlayers = data.nbPlayers
    if(host == 'host' && nbPlayers > 1){
        hide.classList.remove('set')
    }
})

socket.on('send-id', data => {
    id = data.id
})
socket.emit('include-in-room', {username: username, roomcode: roomCode})
lobby.emit('lobby-connect', {username: username, roomcode: roomCode, maxPlayer: maxPlayer, nbTurn: nbTurn})


lobby.on('game-starting', data => {
    var player = username
    window.location.assign("https://guess-the-celebrity1.herokuapp.com/game?username="+player+"&roomcode="+data.roomcode+"&statut="+host+"&maxPlayer="+maxPlayer+"&nbTurn="+nbTurn+"&nbPlayers="+data.nbPlayers)
})



lobby.on('display-name', data => {
    displayName(data.players)
})



lobby.on('message-sent', data => {
    appendMessage(data.message, 'incoming-message', data.username)
})

lobby.on('scroll', () => {
    messageContainer.scrollTop = messageContainer.scrollHeight
})







function appendMessage(message, classname, username){
    const messageDiv = document.createElement('div')
    const messageContent = document.createElement('div')
    messageContent.innerText = message
    messageDiv.className = classname
    messageContent.className = 'message'
    messageContainer.append(messageDiv)
    if(classname == 'incoming-message'){
        const usernameDiv = document.createElement('div')
        usernameDiv.className = 'username'
        usernameDiv.innerText = username+' : '
        messageDiv.append(usernameDiv)
    }
    messageDiv.append(messageContent)
}

function displayName(players){
    waitingPlayers.innerHTML = ''
    for(let i = 0; i < players.length; i++){
        var playerDiv = document.createElement('div')
        var blurBg = document.createElement('div')
        playerDiv.className = 'player'
        blurBg.className = 'blur-bg'
        playerDiv.innerText = players[i]
        waitingPlayers.append(playerDiv)
        playerDiv.append(blurBg)
    }
}


