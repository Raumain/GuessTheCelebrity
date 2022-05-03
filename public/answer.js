const socket = io('https://guess-the-celebrity1.herokuapp.com')
const answerIo = io('/answer')


var main = document.getElementById('main')
var answersDiv = document.querySelector('.answers')
var originalPhoto = document.getElementById('originale')
var editedPhoto = document.getElementById('montage')
var correctName = document.querySelector('.correct-name')
var next = document.querySelector('.next')
var previous = document.querySelector('.previous')
var playersAnswersTemp = []
var playersAnswers = []
var editedPhotosTab = []
var originalPhotosTab = []
var score = 0
var allScores = []
var started = false

if(statut != 'host'){
    previous.style.display = "none"
    next.style.display = "none"
}

if (performance.getEntriesByType("navigation")[0].type ==  'reload' || performance.getEntriesByType("navigation")[0].type ==  'back_forward') {
    console.info( "This page is reloaded" );
    window.location.assign('https://guess-the-celebrity1.herokuapp.com')
  }

answerIo.emit('enter-answer', {username: username, roomcode: roomcode, statut: statut, maxPlayer: maxPlayer, nbTurn: nbTurn, nbPlayers: nbPlayers, id: id})



answerIo.on('wait-for-players', data => {
    if(data.actualConnect == nbPlayers){
        answerIo.emit('get-answers', {roomcode: roomcode, nbPlayers: nbPlayers})
    }
})

answerIo.on('answers', data => {
    if(started) return
    started = true
    Object.values(data.allAnswer).forEach(player => {
        playersAnswersTemp[playersAnswersTemp.length] = player
    })
    Object.values(playersAnswersTemp[0]).forEach(player => {
        playersAnswers[playersAnswers.length] = player
    })
    Object.values(data.originalPhoto).forEach(orignal => {
        originalPhotosTab = orignal.photos
    })
    Object.values(data.editedPhoto).forEach(edit => {
        editedPhotosTab = edit.photos
    })

    for(let i = 0; i < playersAnswers.length; i++){
        if(playersAnswers[i]['id'] == id){
            for(let j = 0; j < playersAnswers[i]['answers'].length; j++){
                if(checkAnswer == '') checkAnswer = ' '
                var checkAnswer = replaceAccent(playersAnswers[i]['answers'][j]).toLowerCase()
                var checkCorrectName = replaceAccent(verifNames(originalPhotosTab[j])).toLowerCase()
                if(checkAnswer == checkCorrectName){
                    score++
                }
            }
        }
    }
    answerIo.emit('score', {roomcode: roomcode, username: username, score: score, nbPlayers: nbPlayers})

    originalPhoto.src = originalPhotosTab[0]
    editedPhoto.src = editedPhotosTab[0]

    correctName.innerHTML = verifNames(originalPhotosTab[0])

    var answerDiv = createNewElement('div', answersDiv, 'answer', '', 'after')
    var answerText = createNewElement('div', answerDiv, 'text', playersAnswers[0]['name'], 'after')
    var answerName = createNewElement('div', answerDiv, 'name', playersAnswers[0]['answers'][0], 'after')

    answerName.style.color = 'red'
    if(playersAnswers[0]['correction'][0] == 'correct') answerName.style.color = 'green'

})

let i = 0
let j = 0
previous.style.display = "none"
next.addEventListener('click', () => {
    if(previous.style.display == "none")
    previous.style.display = "block"
    i++
    if(i == nbPlayers){
        j++
        i = 0
    }
    if(j == playersAnswers[0]['answers'].length){
        answerIo.emit('leaderboard', {roomcode: roomcode, nbPlayers: nbPlayers})
        return
    }
    nextPhoto(i, j, playersAnswers)
    answerIo.emit('next', {roomcode: roomcode, i: i, j: j})
    tempI = i
})
previous.addEventListener('click', () => {
    i--
    if(i == -1){
    	i = nbPlayers-1
        j--
    }
    previousPhoto(i, j, playersAnswers)
    answerIo.emit('previous', {roomcode: roomcode, i: i, j: j})
    if(i == 0 && j == 0) previous.style.display = "none"
})


answerIo.on('next-photo', data => {
    nextPhoto(data.i, data.j, playersAnswers)
})
answerIo.on('previous-photo', data => {
    previousPhoto(data.i, data.j, playersAnswers)
})

answerIo.on('all-scores', data => {
    var i = 0
    var temp
    Object.values(data.scores).forEach(index => {
        temp = index
    })
    Object.values(temp).forEach(player => {
        allScores[i] = player
        i++
    })
    displayLeaderboard()
})



function createNewElement(element, parent, elemClass, content, position){
    var elementDiv = document.createElement(element)
    elementDiv.className= elemClass
    elementDiv.innerText = content
    if(position == 'before'){
        parent.insertBefore(elementDiv, parent.children[0])
    }
    else{
        parent.append(elementDiv)
    }
    return elementDiv
}

function verifNames(name){
    for(let i = 0; i < name.length; i++){
        const splitSlash = name.split('/')
        var n = splitSlash[splitSlash.length-1].replace('_', ' ').split('.')[0]
    }
    return n
}

function replaceAccent(word){
    if(word == '' || word == null || word == undefined) return word = ' '
    word = word.replaceAll(' ', '')
    .replaceAll('é', 'e')
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

function nextPhoto(i, j, playersAnswers){
    var newText = document.querySelector('.text')
    var newName = document.querySelector('.name')
    newText.innerHTML = playersAnswers[i]['name']
    newName.innerHTML = playersAnswers[i]['answers'][j]
    newName.style.color = 'red'
    if(playersAnswers[i]['correction'][j] == 'correct') newName.style.color = 'green'
    correctName.innerHTML = verifNames(originalPhotosTab[j])
    originalPhoto.src = originalPhotosTab[j]
    editedPhoto.src = editedPhotosTab[j]

}

function previousPhoto(i, j, playersAnswers){
    var newText = document.querySelector('.text')
    var newName = document.querySelector('.name')
    newText.innerHTML = playersAnswers[i]['name']
    newName.innerHTML = playersAnswers[i]['answers'][j]
    newName.style.color = 'red'
    if(playersAnswers[i]['correction'][j] == 'correct') newName.style.color = 'green'
    correctName.innerHTML = verifNames(originalPhotosTab[j])
    originalPhoto.src = originalPhotosTab[j]
    editedPhoto.src = editedPhotosTab[j]

}

function displayLeaderboard(){
    main.innerHTML = ''
    var leaderbordHeader = createNewElement('h1', main, 'leaderboard-header', 'Classement', 'after')
    var leaderbord = createNewElement('div', main, 'leaderboard', '', 'after')
    let sortedScore = []
    for(let i = 0; i < allScores.length; i++){
        sortedScore.push([allScores[i].name, allScores[i].score])
    }   
    sortedScore.sort(function(a, b) {return b[1] - a[1]})
    var delay = 0
    for(var i = sortedScore.length-1; i >= 0; i--){
        delay++
        var playerDiv = createNewElement('div', leaderbord, 'player animate__animated animate__backInLeft div'+delay, '', 'before')
        var nameDiv = createNewElement('div', playerDiv, 'username', sortedScore[i][0], 'after')
        var scoreDiv = createNewElement('div', playerDiv, 'score', sortedScore[i][1], 'after')

    }
    // setTimeout(() => {
    //     document.querySelector('.player').classList.remove('animate__backInLeft')
    //     document.querySelector('.player').classList.add('animate__heartBeat')
    // }, delay*1200)
    answerIo.emit('disconnect-everyone')
}