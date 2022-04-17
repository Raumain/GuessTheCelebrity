const socket = io('http://localhost:3000')


const joinForm = document.getElementById('join-form')
const nameForm = document.querySelector('#name-form input')
var usernameOnJoin = document.getElementById('usernameOnJoin')
var usernameOnCreate = document.getElementById('usernameOnCreate')



nameForm.addEventListener('input', () => {
    usernameOnJoin.value = nameForm.value
    usernameOnCreate.value = nameForm.value
})

socket.on('joined-room', data => {
    socket.emit('include-in-room', data)
})
