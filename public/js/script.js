"use strict"

var socket = io.connect(window.location.pathname, {
    query: {
        pseudo: document.querySelector("#statusjoueur .pseudo").textContent
    }
})
const typecarte = { 
    "eau": "url('/img/Carte PCF eau.jpg')",
    "feu": "url('/img/Carte PCF feu.jpg')",
    "plante": "url('/img/Carte PCF plante.jpg')" 
} 

function afficherResultat(ev) {

    const resultat = comparerCarte()
    const bouton = document.querySelector("button")
    const statusResultat = document.querySelector("#resultat")
    if (resultat) {
        let scoreStatus = document.querySelector("#statusjoueur .score")
        let score = parseInt(scoreStatus.textContent, 10)
        score++
        scoreStatus.textContent = score
        if (score > 1) {
            gagner(true)
        } else {
            statusResultat.style.color = "green"
            statusResultat.textContent = "Vous remportez la manche"
        }
        
    } else {
        let scoreStatus = document.querySelector("#statusadv .score")
        let score = parseInt(scoreStatus.textContent, 10)
        score++
        scoreStatus.textContent = score
        if (score > 1) {
            gagner(false)
        } else {
            statusResultat.style.color = "red"
            statusResultat.textContent = "Vous perdez la manche"
        }
    }
    bouton.disabled = false
    bouton.textContent = "Tour suivant"
    bouton.addEventListener("click", reinit)
}

function comparerCarte() {
    const carteAdv = document.querySelector("#adversaire .table").lastChild
    const carteJoueur = document.querySelector("#joueur .table").lastChild

    const puissanceAdversaire = carteAdv.getAttribute("puissance")
    const puissanceJoueur = carteJoueur.getAttribute("puissance")
    const typeAdversaire = carteAdv.getAttribute("type")
    const typeJoueur = carteJoueur.getAttribute("type")

    if (typeAdversaire == typeJoueur) 
        return puissanceJoueur > puissanceAdversaire


    return typeJoueur == "plante" && typeAdversaire == "eau" || 
        typeJoueur == "feu" && typeAdversaire == "plante" || 
            typeJoueur == "eau" && typeAdversaire == "feu" 
}


function envoyer(event) {
    var carte = document.querySelector("#joueur > .table > .carte")
    if (carte) {
        carte.removeEventListener("dragstart", drag)
        socket.emit("valider", {
            type: carte.getAttribute("type"),
            puissance: carte.getAttribute("puissance")
        })
        event.currentTarget.textContent = "Choix envoyé"
        event.currentTarget.style.color = "green"
        event.currentTarget.disabled = true
        event.currentTarget.removeEventListener("click", envoyer)
        socket.on("reveler", function (msg) {
            var tableadversaire = document.querySelector("#adversaire .table")
            var tablejoueur = document.querySelector("#joueur .table")
            console.log("reveler")
            let carte = document.createElement("div")
            carte.setAttribute("class", "carte")
            carte.setAttribute("puissance", msg.puissance)
            carte.setAttribute("type", msg.type)
            carte.style.transform = "rotateY(180deg) translate(3px,-3px)"
            carte.style.backgroundImage = typecarte[msg.type]
            tableadversaire.appendChild(carte)
            tableadversaire.addEventListener("transitionend", afficherResultat)
            tableadversaire.style.transform = "rotateY(180deg)"
            tablejoueur.style.transform = "rotateY(0deg)"
        })
    } else {
        event.currentTarget.textContent = "Veuiller déposer une carte"
        event.currentTarget.style.color = "red"
    }
}

function gagner(vrai) {
    let statusResultat = document.querySelector("#resultat")
    let bouton = document.querySelector("button")
    if (vrai) {
        statusResultat.style.color = "green"
        statusResultat.textContent = "Vous avez gagné la partie" 
    } else {
        statusResultat.style.color = "red"
        statusResultat.textContent = "Vous avez perdu la partie" 
    }
    bouton.textContent = "Retourner à l'acceuil"
    bouton.addEventListener("click", function() {
        location.href = "/"
    })
}

function reinit(ev) {
    let tablejoueur = document.querySelector("#joueur .table")
    let tableadversaire = document.querySelector("#adversaire .table")
    let scoreResultat = document.querySelector("#resultat")
    let scoreAdv = document.querySelector("#statusadv .score").textContent
    let statusJoueur = document.querySelectorAll("#statusjoueur .score").textContent
    ev.currentTarget.textContent = "Valider votre choix."
    ev.currentTarget.removeEventListener("click", reinit)
    ev.currentTarget.addEventListener("click", envoyer)
    tablejoueur.removeChild(tablejoueur.lastChild)
    tableadversaire.innerHTML = ""
    tableadversaire.removeEventListener("transitionend", comparerCarte)
    tableadversaire.style.transform= "rotateY(0deg)"
    tablejoueur.classList.remove("rotation")
    tablejoueur.style.transform = ""
}

function drag(ev) {
    ev.dataTransfer.setData("text", ev.currentTarget.getAttribute("numero-carte"))
    ev.dataTransfer.effectAllowed = "move"
}

function dragOver(ev) {
    ev.preventDefault();
    if (ev.currentTarget.childElementCount > 1) {
        ev.dataTransfer.dropEffect = "none"
    } else {
        ev.dataTransfer.dropEffect = "move"
    }
}


function dropTable(ev) {
    ev.preventDefault()
    var numcarte = ev.dataTransfer.getData("text")
    var carte = document.querySelector("#joueur div[numero-carte='" + numcarte + "']")
    var clone = carte.cloneNode(true)
    clone.addEventListener("dragstart", drag)
    carte.parentNode.removeChild(carte)
    ev.currentTarget.appendChild(clone)
    ev.currentTarget.classList.add("rotation")
    socket.emit("deplacer", {
        carte: numcarte,
        placeholder: "table"
    })
}

function dropPlaceHolder(ev) {
    ev.preventDefault()
    var numcarte = ev.dataTransfer.getData("text")
    if (numcarte === ev.currentTarget.getAttribute("carte")) {
        var carte = document.querySelector("#joueur div[numero-carte='" + numcarte + "']")
        var clone = carte.cloneNode(true)
        clone.addEventListener("dragstart", drag)
        carte.parentNode.removeChild(carte)
        ev.currentTarget.appendChild(clone)
        document.querySelector("#joueur .table").classList.remove("rotation")
        console.log("drop placeholder")
        socket.emit("deplacer", {
            carte: numcarte,
            placeholder: numcarte
        })
    }
}

function generateCard() {
    var carte = document.createElement("div")
    carte.setAttribute("class", "carte")

    return carte
}


function generateRandomCard(nbr) {

    var tabcarte = []
    for (let i = 0; i < nbr; i++) {
        let index = Math.floor(Math.random()*Object.keys(typecarte).length)
        let type = Object.keys(typecarte)[index]
        console.log(type)
        let carte = generateCard()
        carte.setAttribute("class", "carte")
        carte.setAttribute("draggable", true)
        carte.setAttribute("type", type)
        carte.setAttribute("puissance", Math.ceil(Math.random()*6))
        carte.style.backgroundImage = typecarte[type]
        carte.addEventListener("dragstart", drag)
        carte.setAttribute("numero-carte", i)
        tabcarte.push(carte)
    }

    return tabcarte
}

function deplacer(element, placeholder, offset=0) {
    
    var posx = placeholder.getBoundingClientRect().x-element.getBoundingClientRect().x+offset
    var posy = placeholder.getBoundingClientRect().y-element.getBoundingClientRect().y+offset
    element.style.transform = "translate(" + posx + "px, " + posy + "px)"
}

function distribuerCarteJoueur(e) {
    
    var placeholders = document.querySelectorAll("#joueur .placeholder")
    var deck =  e.currentTarget
    var cartes = generateRandomCard(placeholders.length)
    cartes.forEach(function (element, index) {
        deck.appendChild(element)
        element.addEventListener("suivant", function(ev) {
            deplacer(element, placeholders[index])
        })
        element.addEventListener("transitionend", function (ev) {

            placeholders[index].appendChild(element)
            element.style.transform = "translate(-3px,-3px)"
            var carte = cartes.pop()
            if (carte) {
                var event = new CustomEvent("suivant")
                carte.dispatchEvent(event)
            } else {
                deck.removeEventListener("click", distribuerCarteJoueur)
            }
        })
    })
    var event = new CustomEvent("suivant")
    cartes.pop().dispatchEvent(event)
}

function distribuerCarteAdversaire(ev) {
    var placeholders = document.querySelectorAll("#adversaire .placeholder")
    var deck = ev.currentTarget
    var cartes = []
    for (let i = 0; i < placeholders.length; i++) {
        var element = generateCard()
        element.setAttribute("class", "carte")
        element.setAttribute("numero-carte", i)
        element.setAttribute("type", "neutre")
        element.style.backgroundImage = "url('/img/Dos carte.jpg')" 
        cartes.push(element)
    }
    cartes.forEach(function (element, index) {
        deck.appendChild(element)
        element.addEventListener("suivant", function(ev) {
            deplacer(element, placeholders[2-index])
        })
        element.addEventListener("transitionend", function (ev) {

            placeholders[2-index].appendChild(element)
            element.style.transform = "translate(-3px,-3px)"
            var carte = cartes.pop()
            if (carte) {
                var event = new CustomEvent("suivant")
                carte.dispatchEvent(event)
            } else {
                deck.removeEventListener("click", distribuerCarteJoueur)
            }
        })
    })
    var event = new CustomEvent("suivant")
    cartes.pop().dispatchEvent(event)
}


var deckjoueur = document.querySelector("#joueur .deck")
var deckadversaire = document.querySelector("#adversaire .deck")
var tablejoueur = document.querySelector("#joueur .table")
var tableadversaire = document.querySelector("#adversaire .table")
var placeholdersjoueur = document.querySelectorAll("#joueur .placeholder")
var placeholdersadv = document.querySelectorAll("#adversaire .placeholder")
var bouton = document.querySelector("#bouton")

deckadversaire.addEventListener("distribuer", distribuerCarteAdversaire)

tablejoueur.addEventListener("dragover", dragOver)
tablejoueur.addEventListener("drop", dropTable)
deckjoueur.addEventListener("click", distribuerCarteJoueur)
bouton.addEventListener("click", envoyer)

for (let i = 0; i < placeholdersjoueur.length; i++) {
    placeholdersjoueur[i].addEventListener("dragover", dragOver)
    placeholdersjoueur[i].addEventListener("drop", dropPlaceHolder)
}

socket.on("deplacer", function (msg) {
    var carte = document.querySelector("#adversaire div[numero-carte='" + msg.carte + "']")
    if (msg.placeholder === "table") {
        carte.addEventListener("transitionend", function () {
            tableadversaire.appendChild(carte)
        })
        deplacer(carte, tableadversaire, -3)
    } else {
        let placeholder = document.querySelector("#adversaire div[carte='" + msg.placeholder+ "']")
        carte.addEventListener("transitionend", function () {
            placeholder.appendChild(carte)
        })
        deplacer(carte, placeholder, -3)
    }
})

socket.on("nouveaujoueur", function () {
    var event = new CustomEvent("distribuer")
    deckadversaire.dispatchEvent(event)
})


socket.emit("pret")
