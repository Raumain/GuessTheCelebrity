const socket = io('http://localhost:3000')
const game = io('/game')


var timer = document.querySelector('.timer')
var timerDiv = document.querySelector('.cadre')
var photo = document.querySelector('.photos img')
var answerInput = document.getElementById('answer-input')
var suggests = document.querySelector('.suggests')
var allPhotos = []
var chosenPhotos = []
var answers = []
var answer = 'Rien'
var correctNames = []
var allCorrectNames = []
var score = 0
var playersAnswers = []
var id
var started = false
var actualConnections
var correction = []

if (performance.getEntriesByType("navigation")[0].type ==  'reload' || performance.getEntriesByType("navigation")[0].type ==  'back_forward') {
    console.info( "This page is reloaded" );
    window.location.assign('http://localhost:3000')
  } 

game.emit('enter-game', {username: username, roomcode: roomcode, statut: statut, maxPlayer: maxPlayer, nbTurn: nbTurn})

game.on('send-id', data => {
    id = data.id
})

game.on('actual-connections', data => {
    actualConnections = data.actualConnect
    console.log(actualConnections)
})

if(statut == 'host'){
    console.log(statut)
    game.emit('choose-photos', {roomcode: roomcode, nbPlayers: nbPlayers})
    var inter = setInterval(() => {
        console.log('r')
        console.log(actualConnections)
        console.log(nbPlayers)
        if(actualConnections == nbPlayers){
            game.emit('get-originals', {roomcode: roomcode})
            clearInterval(inter)
        }
    }, 1000)
}

game.on('send-photos', data=>{
    console.log('send photos')
    if(started) { console.log('already started') }
    started = true
    for(let i = 0; i < data.photos.length; i++){
        allPhotos[i] = '/Images/Acteur/Montages/' + data.photos[i]
    }
    getAllPhotos()
})
game.on('chosen-photos', data => {
    if(started) { console.log('already started') }
    chosenPhotos = data.chosenPhotos
    // var bg = document.createElement('div')
    // bg.className = 'bg'
    // timer.insertBefore(bg, timer.children[0])
    // bg.style.animation = 'bg 11s linear infinite'
    startGame(data.chosenPhotos, 2)
})


game.on('send-all-originals', data=>{
    allCorrectNames = data.photos
})

game.on('send-originals', data=>{
    for(let i = 0; i < data.photos.length; i++){
        correctNames[i] = '/Images/Acteur/Originales/' + data.photos[i]
    }
})

game.on('send-answers', data => {
    endGame(data.answers)
})

game.on('redirect', () => {
    window.location.assign('http://localhost:3000/answers?id='+id+'&username='+username+"&roomcode="+roomcode+"&statut="+statut+"&maxPlayer="+maxPlayer+"&nbTurn="+nbTurn+"&nbPlayers="+nbPlayers)
})







function getAllPhotos(){
    if(started) { console.log('already started') }
    for(let i = 0; i < 2; i++){
        var chosen = allPhotos[Math.floor(Math.random()*allPhotos.length)]
        console.log(chosen)
        while(chosenPhotos.includes(chosen)){
            console.log(chosen)
            chosen = allPhotos[Math.floor(Math.random()*allPhotos.length)]
        }
        chosenPhotos[i] = chosen
    }
    console.log(chosenPhotos)
    game.emit('send-chosen-photos', {chosenPhotos: chosenPhotos, roomcode: roomcode})
}

function startGame(chosenPhotos, maxTurn){
    answerInput.addEventListener('input', () => {
        answer = answerInput.value
        suggests.innerHTML = '<div class="suggests-title">Suggestions :</div>'
	    for(let i = 0; i < allCorrectNames.length; i++){
        	var prenom = allCorrectNames[i].split('.')[0].replace('_', ' ').split(' ')[0].toLowerCase()
            var nom = allCorrectNames[i].split('.')[0].replace('_', ' ').split(' ')[1].toLowerCase()
            var fullname = allCorrectNames[i].split('.')[0].replace('_', ' ').toLowerCase()
            var fullname2 = allCorrectNames[i].split('.')[0].replace('_', ' ')
            var userInput = replaceAccent(answerInput.value, false).toLowerCase()
        	if(prenom.startsWith(userInput) || nom.startsWith(userInput) || fullname.startsWith(userInput)){
                createNewElement('div', suggests, 'suggest-name', fullname2)
            }
            if(answerInput.value == '') suggests.innerHTML = '<div class="suggests-title">Suggestions :</div>'
        }
    })
    
    var decount = 10
    var i = 0
    var turn = 0  
    photo.src = chosenPhotos[turn]  
    var inter = setInterval(()=>{
        timerDiv.innerHTML = decount-i
        if(timerDiv.innerHTML == '0'){
            turn++
            photo.src = chosenPhotos[turn]
            i = 0
            if(turn == maxTurn){
                clearInterval(inter)
                game.emit('save-current-answer', {id: id, answer: answer})
                decryptAllNames(chosenPhotos, answers)
                document.querySelector('.loader').style.display = 'flex'
            }else{
                game.emit('save-current-answer', {id: id, answer: answer})
                if(answer == '' || answer == ' ' || answerInput.value == '' || answerInput.value == ' ') answer = 'Rien'
                answerInput.value = ''
            }
        }
        i++
    },1000)
    document.querySelector('.loader').style.display = 'none'

}


function verifNames(name){
    for(let i = 0; i < name.length; i++){
        const splitSlash = name.split('/')
        var n = splitSlash[splitSlash.length-1].replace('_', ' ').split('.')[0]
        n = replaceAccent(n, true).toLowerCase()
    }
    return n
}
function endGame(answers){
    for(let i = 0; i < correctNames.length; i++){
        var name = verifNames(correctNames[i])
        var answer = replaceAccent(answers[i], true).toLowerCase()
        if(answer == name){
            score++
            correction[i] = 'correct'
        }
        else{
            correction[i] = 'incorrect'
        }
        console.log(answer)
        console.log(name)
        console.log(correction)
    }
    console.log(chosenPhotos)
    console.log(correctNames)
    game.emit('send-score', {username: username, roomcode: roomcode, score: score, answers: answers, correction: correction, id: id, chosenPhotos: chosenPhotos, correctNames: correctNames, nbPlayers: nbPlayers})
}

function createNewElement(element, parent, elemClass, content){
    var elementDiv = document.createElement(element)
    elementDiv.className= elemClass
    elementDiv.innerText = content
    parent.append(elementDiv)
    return elementDiv
}


function replaceAccent(word, replaceSpace){
    if(word == '' || word == null || word == undefined) return word = ' '
    if(replaceSpace){
        word = word.replaceAll(' ', '')
    }
    word = word.replaceAll('é', 'e')
    .replaceAll('è', 'e')
    .replaceAll('ê', 'e')
    .replaceAll('ë', 'e')
    .replaceAll('à', 'a')
    .replaceAll('â', 'a')
    .replaceAll('ä', 'a')
    .replaceAll('î', 'i')
    .replaceAll('ï', 'i')
    .replaceAll('û', 'u')
    .replaceAll('ü', 'u')
    .replaceAll('ù', 'u')
    .replaceAll('ô', 'o')
    .replaceAll('ö', 'o')
    .replaceAll('ç', 'c')
    return word
}


function encryptName(name){
    var newName = ''
	for(let i = 0; i < name.length; i++){
    	newName += name[i].charCodeAt(0)
    }
    return newName
}

function decryptName(name){
	var newNameTab = name.split('/')
    var tabWithoutSlash = newNameTab[newNameTab.length-1].split('.')[0]
    var names = tabWithoutSlash.split('_')
    var newName = ''
	for(let i = 0; i < names.length ; i++){
        if(names[i] != ''){
            newName += String.fromCharCode(names[i])
        }
    }
    return newName+'.png'
}

function decryptAllNames(photos, answers){
    var decryptedNames = []
    for(let i = 0; i < photos.length; i++){
        decryptedNames[i] = decryptName(photos[i])
    }
    game.emit('end-game', {photos: decryptedNames, answers: answers, roomcode: roomcode, id: id})
}
