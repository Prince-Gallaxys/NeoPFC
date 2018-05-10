"use strict"

function createGame() {
    var xhr = new XMLHttpRequest()
    var pseudo = encodeURIComponent(document.getElementById("pseudo").value)
    xhr.open("POST", "http://localhost:8080/game")
    xhr.addEventListener("readystatechange", function() {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            console.log(xhr.responseText)
            var response = JSON.parse(xhr.responseText)
            var lien = document.createElement("a")
            lien.href = "/game/" + response.id
            lien.innerHTML = "Rejoindre partie"
            var body = document.getElementsByTagName("body")[0]
            body.appendChild(lien)

        }
    })
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.send("pseudo=" + pseudo)

}


function joinGame() {
    var xhr = new XMLHttpRequest()
    var pseudo = encodeURIComponent(document.getElementById("pseudo").value)
    var gameId = document.getElementById("gameid").value
    xhr.open("POST", "http://localhost:8080/game/" + gameId)
    xhr.addEventListener("readystatechange", function() {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            console.log(xhr.responseText)
            var response = JSON.parse(xhr.responseText)
            var lien = document.createElement("a")
            lien.href = "/game/" + response.id
            lien.innerHTML = "Rejoindre partie"
            var body = document.getElementsByTagName("body")[0]
            body.appendChild(lien)

        }
    })
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.send("pseudo=" + pseudo)

}


var bouton = document.getElementById("validate")
bouton.onclick = createGame
var autrebouton = document.getElementById("joingame") 
autrebouton.onclick = joinGame
