"use strict";

const Hapi = require("hapi")
const Inert = require("inert")
const Path = require("path")
const Handlebars = require("handlebars")
const io = require("socket.io")
Handlebars.registerPartial("ContentPartial", "{{{content}}}")

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
    await server.register(require("vision"))
    

    server.views({
        engines: {
            html: Handlebars
        },
        relativeTo: Path.join(__dirname, "public"),
        path: "html/templates",
        layout: true,
        layoutPath: "html/templates/layout"
    })

    server.route({
        method: "GET",
        path: "/",
        handler(resquest, reply) {
            return reply.view("lobby")
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

    server.route({
        method: "GET",
        path: "/js/{param*}",
        handler: {
            directory: {
                path: "js"
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
