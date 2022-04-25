const socket = io('http://localhost:3000')

const joinForm = document.getElementById('join-form')
const createForm = document.getElementById('create-form')
var codeOnCreate = document.getElementById('codeOnCreate')
var codeOnJoin = document.getElementById('join-code')
const nameForm = document.querySelector('#name-form')
const nameInput = document.querySelector('#name-form input')
var usernameOnJoin = document.getElementById('usernameOnJoin')
var usernameOnCreate = document.getElementById('usernameOnCreate')

function generateCode(){
    var code = ''
    var alphabet = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z']
    for(let i = 0; i < 10; i++){
      code += alphabet[Math.floor(Math.random()*alphabet.length)]
    }
    return code
  }

nameForm.addEventListener('submit', e => {
    e.preventDefault()
})
nameInput.addEventListener('input', () => {
    usernameOnJoin.value = nameInput.value
    usernameOnCreate.value = nameInput.value
})

createForm.addEventListener('submit', () => {
    var code = generateCode()
    codeOnCreate.value = code
})

joinForm.addEventListener('submit', () => {
    // socket.emit('include-in-room', {username: usernameOnJoin.value, roomcode: codeOnJoin.value, message: 'joining include'})
})