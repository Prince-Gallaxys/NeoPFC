"use strict";

const Hapi = require("hapi")
const Nes = require("nes")
const Inert = require("inert")
const Path = require("path")

const server = Hapi.server({
    host: "localhost",
    port: "8080",
    routes: {
        files: {
            relativeTo: Path.join(__dirname, "public") 
        }
    }
})


const start = async () => {
    
    await server.register(Inert)
    await server.register(Nes)
    await server.register(require("vision"))

    server.views({
        engines: {
            html: require("handlebars")
        },
        relativeTo: Path.join(__dirname, "public"),
        path: "html/templates"
    })

    server.route({
        method: "GET",
        path: "/",
        handler(resquest, reply) {
            return reply.file("html/statics/lobby.html")
        } 
        
    })

    server.route({
        method: "GET",
        path: "/game",
        handler(request, reply) {
            console.log(request)

            return reply.view("game.html", {
                name: "Jacqui",
                ip: request.info.remoteAddress
            })
        }
    })

    server.route({
        method: "GET",
        path: "/img/{param}",
        handler: {
            directory: {
                path: "img"
            }
        }
    })

    server.route({
        method: "GET",
        path: "/css/{param*}",
        handler: {
            directory: {
                path: "css"
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
