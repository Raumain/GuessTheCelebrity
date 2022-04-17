const socket = io('http://localhost:3000')

var messageContainer = document.getElementById('chat-box')
var messageForm = document.getElementById('message-form')
var message = document.getElementById('message')

const isEmpty = str => !str.trim().length;

messageForm.addEventListener('submit', (e) => {
    e.preventDefault()
    if(message.value != null && message.value != '' && !isEmpty(message.value)){
        socket.emit('send-message', {username: username, message: message.value})
        appendMessage(message.value, 'outgoing-message', '')
        message.value = ''
    }
})

socket.emit('include-in-room', {username: username, roomcode: roomCode})


socket.on('message-sent', data => {
    appendMessage(data.message, 'incoming-message', data.username)
})

socket.on('joined-room', data => {
    console.log(data)
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