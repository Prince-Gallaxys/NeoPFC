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
    
    redis.hmset(
        `user:${id}`, 
        "name", "", 
        "gameId", -1,
        "score", 0,
        "status", "joueur"
    )

    redis.sadd("listeUserId", id)

    return id
}

const start = async () => {
    
    await server.register(Inert)
    await server.register(require("vision"))

    server.state("userId", {
        ttl: null,
        isSecure: false,
        isHttpOnly: false,
        path: "/game",
        encoding: "base64",
        clearInvalid: false, // remove invalid cookies
        strictHeader: true // don't allow violations of RFC 6265
    });

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
            var userName = request.payload.pseudo

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
                "gameId", gameId
            )

            reply.state("userId", `${userId}`)

            var nsp = io.of(`/game/${gameId}`)

            nsp.on("connection", function(client) {

                redis.hset("socketIdToUserId", client.id, userId)
                redis.hset(`user:${userId}`, "socketId", client.id)

                client.on("disconnect", async function(reason) {

                    redis.srem(`game:${gameId}`, userId)
                    redis.srem("listeGameId", gameId)
                    redis.srem("listeUserId", userId)
                    redis.hdel("socketIdToUserId", client.id)
                    redis.del(`user:${userId}`)

                })
            })
            
            return reply.redirect(`/game/${gameId}`)
        }
    })
    

    server.route({
        method: "GET",
        path: "/game/{id}",
        async handler(request, reply) {

            console.log(request.state.userId)
            if (!request.state.userId) {
                return reply.redirect("/")
            }

            return reply.view("game.html")
        }
    })

    server.route({
        method: "POST",
        path: "/game/{id}",
        async handler(request, reply) {

            var userName = request.payload.pseudo
            var userId = await generateUserId()
            var gameId = request.params.id

            redis.hmset(
                `user:${userId}`,
                "gameId", gameId,
                "name", userName
            )

            redis.sadd("listeUserId", userId)
            redis.sadd(`game:${gameId}`, userId)
            reply.state("userId", `${userId}`)

            return reply.redirect(`/game/${gameId}`)

        }
    })

    server.route({
        method: "GET",
        path: "/user/{id}/name",
        handler(request, reply) {

            var userId = request.state.userId


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

