"use strict";

const Hapi = require("hapi")
const Inert = require("inert")
const Path = require("path")
const Handlebars = require("handlebars")
const Io = require("socket.io")
const Redis = require("ioredis")
Handlebars.registerPartial("ContentPartial", "{{{content}}}")

const redis = new Redis()

const server = Hapi.server({
    host: "localhost",
    port: "8080",
    
    routes: {
        files: {
            relativeTo: Path.join(__dirname, "public") 
        }
    }
})

const io = new Io(server.listener)

async function generateGameId() {
    var id = 0;
    var i = 0;
    
    do {
        id = Math.round(Math.random() * 100)
        i += 1;
    } while ( await redis.sismember("listeGameId", id) && i <= 100)
    
    if (i > 100) {

        throw new Error("Trop de parties lancées");
    }
    
    redis.sadd("listeGameId", id)

    return id;
}

async function generateUserId() {
    
    var id = 0
    var i = 0

    do {
        id = Math.round(Math.random() * 200)
        i += 1;
    } while ( await redis.sismember("listeUserId", id) && i <= 200 )

    if ( i > 200 ) {
        throw new Error("Trop d'utilisateurs")
    }

    redis.sadd("listeUserId", id)

    return id
}

const start = async () => {
    
    await server.register(Inert)
    await server.register(require("vision"))
    

    server.views({
        engines: {
            html: Handlebars
        },
        relativeTo: Path.join(__dirname, "."),
        path: "templates",
        layout: true,
        layoutPath: "templates/layout"
    })

    server.route({
        method: "GET",
        path: "/",
        handler(resquest, reply) {
            return reply.view("index")
        } 
        
    })

    server.route({
        method: "POST",
        path: "/game",
        async handler(request, reply) {
            var gameId = null;
            var userId = null;
            var userName = request.query.username
            
            if (!userName) {
                userName = "Sans nom"
            }

            try {
                userId = await generateUserId()
                gameId = await generateGameId();

            } catch (e) {
                console.log(e.message)
            }

            redis.sadd(`game:${gameId}`, userId)

            redis.hmset(
                `user:${userId}`, 
                "name", userName, 
                "gameId", gameId,
                "score", 0,
                "status", "joueur"
            )

            // return reply.redirect(`/game/${id}`)

            reply.state("userId", `${userId}`)
            
            return reply.response().created(`/game/${gameId}`)
        }
    })
    

    server.route({
        method: "GET",
        path: "/game/{id}",
        handler(request, reply) {

            return reply.view("game.html")
        }
    })

    server.route({
        method: "GET",
        path: "/img/{filename}",
        handler: {
            directory: {
                path: "img"
            }
        }
    })


    server.route({
        method: "GET",
        path: "/{filename}.css",
        handler: {
            
            file: function(request) {
                return "css/" + request.params.filename + ".css"
            }
        }
    })

    server.route({
        method: "GET",
        path: "/{filename}.js",
        handler: {
            
            file: function(request) {
                return "js/" + request.params.filename + ".js"
            }
        }
    })
    

    try {
        await server.start();
    }
    catch (err) {
        console.log(err);
        process.exit(1);
    }

    console.log("Server running at:", server.info.uri);
}

start()

io.sockets.on("connection", function(socket){
    console.log("Une nouvelle connection");
})
