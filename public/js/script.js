"use strict"

var zoneJoueur = document.getElementById("joueur")
var zoneAdversaire = document.getElementById("adversaire")

var decks = document.getElementsByClassName("deck")

function generateCard(noeud) {
    var card = document.createElement("img")
    card.setAttribute("src", "/img/carte.jpeg")
    card.setAttribute("height", "96")
    card.setAttribute("width", "70")
    noeud.appendChild(card)
}

function generateRandomCard(noeud) {
    var randomCard = document.createElement("img")
    noeud.appendChild(randomCard)
}

for (var i = 0, len = decks.length; i < len; i++) {
    decks[i].addEventListener("click", function(e){
        generateCard(e.currentTarget)
        console.log(e.currentTarget)
    })
}
var socket = io.connect("http://localhost:8080");

