"use strict";

const Hapi = require("hapi")
const Inert = require("inert")
const Path = require("path")
const Handlebars = require("handlebars")
const Io = require("socket.io")
const Redis = require("ioredis")
const Gid = require("./gid.js")
Handlebars.registerPartial("ContentPartial", "{{{content}}}")

const redis = new Redis()
var gid = new Gid(redis)


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

const start = async () => {

    await server.register(Inert)
    await server.register(require("vision"))

    server.state("userId", {
        ttl: null,
        isSecure: false,
        isHttpOnly: false,
        path: "/",
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
            return reply.view("accueil")
        }

    })

    server.route({
        method: "GET",
        path: "/rejoindre",
        handler(resquest, reply) {
            return reply.view("rejoindre")
        }
    })

    server.route({
        method: "GET",
        path: "/creer",
        handler(resquest, reply) {
            return reply.view("creer")
        }
    })

    server.route({
        method: "GET",
        path: "/statistiques",
        handler(resquest, reply) {
            return reply.view("statistiques")
        }
    })

    server.route({
        method: "POST",
        path: "/game",
        async handler(request, reply) {

            var userId = null;
            var gameId = request.payload.gameId;
            var userName = request.payload.pseudo

            if (!gameId) {
                if (!userName) {
                    userName = "Sans nom"
                }

                try {
                    userId = await gid.generateUserId()
                    gameId = await gid.gererateGameId();

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

            } else if (await redis.scard(`game:${gameId}`) < 2) {
                userId = await gid.generateUserId()

                redis.hmset(
                    `user:${userId}`,
                    "gameId", gameId,
                    "name", userName
                )

                redis.sadd("listeUserId", userId)
                redis.sadd(`game:${gameId}`, userId)
                reply.state("userId", `${userId}`)

            } else {

                return reply("Partie pleine")
            }


            var nsp = io.of(`/game/${gameId}`)

            nsp.on("connection", function(client) {

                console.log("connection")
                redis.hset("socketIdToUserId", client.id, userId)
                redis.hset(`user:${userId}`, "socketId", client.id)

                client.on("disconnect", async function(reason) {
                    console.log(reason)
                    redis.srem(`game:${gameId}`, userId)
                    redis.srem("listeUserId", userId)
                    redis.hdel("socketIdToUserId", client.id)
                    redis.del(`user:${userId}`)
                    if (await redis.scard(`game:${gameId}`) === 1) {
                        redis.srem("listeGameId", gameId)
                    }

                })
            })

            return reply.redirect(`/game/${gameId}`)
        }
    })


    server.route({
        method: "GET",
        path: "/game/{id}",
        async handler(request, reply) {

            var userId = request.state.userId
            console.log("Salut")
            if (!(userId && await redis.sismember("listeUserId", userId))) {

                console.log("Attention")
                reply.unstate("userId")

                console.log("Pas de probleme")

                return reply.redirect("/")
            }

            return reply.view("jeux.html", null, { layout: "layout_jeu" })
        }
    })

    server.route({
        method: "GET",
        path: "/game/other/user/name",
        async handler(request, reply) {

            var userId = request.state.userId
            var gameId =  await redis.hget(`user:${userId}`, "gameId")
            var usersId = await redis.smembers(`game:${gameId}`)
            var otherId = usersId.filter((id) => id !== userId)[0]

            if (otherId) {
                return {
                    name: await redis.hget(`user:${otherId}`, "name")
                }
            }

            return {
                err: "Vous êtes tout seul"
            }


        }
    })

    server.route({
        method: "GET",
        path: "/game/other/user/score",
        async handler(request, reply) {


            var userId = request.state.userId
            var gameId =  await redis.hget(`user:${userId}`, "gameId")
            var usersId = await redis.smembers(`game:${gameId}`)
            var otherId = usersId.filter((id) => id !== userId)[0]

            if (otherId) {
                return {
                    score: await redis.hget(`user:${otherId}`, "score")
                }
            }

            return {
                err: "Vous êtes tout seul"
            }


        }
    })

    server.route({
        method: "GET",
        path: "/free/games",
        async handler(request, reply) {
            var gamesId = await redis.smembers("listeGameId")
            gamesId = gamesId.filter(async (element) => await redis.scard(`game:${element}`) === 1)

            return gamesId
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
