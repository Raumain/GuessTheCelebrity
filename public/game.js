const socket = io('https://courageous-cobbler-2b76e5.netlify.app')
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
    window.location.assign('https://courageous-cobbler-2b76e5.netlify.app')
  } 

game.emit('enter-game', {username: username, roomcode: roomcode, statut: statut, maxPlayer: maxPlayer, nbTurn: nbTurn})

game.on('send-id', data => {
    id = data.id
})

game.on('actual-connections', data => {
    actualConnections = data.actualConnect
})

if(statut == 'host'){
    game.emit('choose-photos', {roomcode: roomcode, nbPlayers: nbPlayers})
    var inter = setInterval(() => {
        if(actualConnections == nbPlayers){
            game.emit('get-originals', {roomcode: roomcode})
            clearInterval(inter)
        }
    }, 1000)
}

game.on('send-photos', data=>{
    if(started) {  }
    started = true
    for(let i = 0; i < data.photos.length; i++){
        allPhotos[i] = '/Images/Montages/' + data.photos[i]
    }
    getAllPhotos()
})
game.on('chosen-photos', data => {
    if(started) {  }
    chosenPhotos = data.chosenPhotos
    startGame(data.chosenPhotos, nbTurn)
})


game.on('send-all-originals', data=>{
    allCorrectNames = data.photos
})

game.on('send-originals', data=>{
    for(let i = 0; i < data.photos.length; i++){
        correctNames[i] = '/Images/Originales/' + data.photos[i]
    }
})

game.on('send-answers', data => {
    endGame(data.answers)
})

game.on('redirect', () => {
    window.location.assign('https://courageous-cobbler-2b76e5.netlify.app/answers?id='+id+'&username='+username+"&roomcode="+roomcode+"&statut="+statut+"&maxPlayer="+maxPlayer+"&nbTurn="+nbTurn+"&nbPlayers="+nbPlayers)
})







function getAllPhotos(){
    if(started) { }
    for(let i = 0; i < nbTurn; i++){
        var chosen = allPhotos[Math.floor(Math.random()*allPhotos.length)]
        while(chosenPhotos.includes(chosen)){
            chosen = allPhotos[Math.floor(Math.random()*allPhotos.length)]
        }
        chosenPhotos[i] = chosen
    }
    game.emit('send-chosen-photos', {chosenPhotos: chosenPhotos, roomcode: roomcode})
}

function startGame(chosenPhotos, maxTurn){
    answerInput.addEventListener('input', () => {
        answer = answerInput.value
        suggests.innerHTML = '<div class="suggests-title">Suggestions :<br><span>(Cliquez pour séléctionner)</div>'
	    for(let i = 0; i < allCorrectNames.length; i++){
            var mid, midend = ''
            var end = ''
            var checkFirst = allCorrectNames[i].split('.')[0].replaceAll('_', ' ').split(' ')[0]
            var checkMid = allCorrectNames[i].split('.')[0].replaceAll('_', ' ').split(' ')[1]
            var checkEnd = allCorrectNames[i].split('.')[0].replaceAll('_', ' ').split(' ')[2]
        	var first = checkFirst.toLowerCase()
            if(checkMid != undefined){
                mid = checkMid.toLowerCase()
                if(checkEnd != undefined){
                    end = checkEnd.toLowerCase()
                    midend = mid + ' ' + end;
                }
            }
            var fullname = allCorrectNames[i].split('.')[0].replaceAll('_', ' ').toLowerCase()
            var fullname2 = allCorrectNames[i].split('.')[0].replaceAll('_', ' ')
            var userInput = replaceAccent(answerInput.value, false).toLowerCase()
        	if(first.startsWith(userInput) || mid.startsWith(userInput) || end.startsWith(userInput) || midend.startsWith(userInput) || fullname.startsWith(userInput)){
                createNewElement('div', suggests, 'suggest-name', fullname2)
            }
            if(answerInput.value == '') suggests.innerHTML = '<div class="suggests-title">Suggestions :<br><span>(Cliquez pour séléctionner)</div>'
        }
        var allSuggests = document.querySelectorAll('.suggest-name')
        for(let i = 0; i < allSuggests.length; i++){
            allSuggests[i].addEventListener('click', () => {
                answerInput.value = allSuggests[i].innerHTML
                answer = allSuggests[i].innerHTML
            })
        }
    })
    
    var decount = 10
    var i = 0
    var turn = 0 
    var check = true 
    photo.src = chosenPhotos[turn]  
    if(check){
        var bg = document.createElement('div')
        bg.className = 'bg'
        timer.insertBefore(bg, timer.children[0])
        check = false
    }
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
        var n = splitSlash[splitSlash.length-1].split('.')[0].replaceAll('_', ' ')
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
    }
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
