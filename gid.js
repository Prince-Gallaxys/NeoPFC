"use strict"


class Gid {

    constructor (redis) {
        this.redis = redis
    }

    async generateUserId () {

        var id = 0
        var i = 0

        do {
            id = Math.round(Math.random() * 200)
            i += 1;
        } while ( await this.redis.sismember("listeUserId", id) && i <= 200 )

        if ( i > 200 ) {
            throw new Error("Trop d'utilisateurs")
        }

        this.redis.hmset(
            `user:${id}`,
            "name", "",
            "gameId", -1,
            "score", 0,
            "status", "joueur"
        )

        this.redis.sadd("listeUserId", id)

        return id
    }

    async gererateGameId() {
        var id = 0;
        var i = 0;

        do {
            id = Math.round(Math.random() * 100)
            i += 1;
        } while ( await this.redis.sismember("listeGameId", id) && i <= 100)

        if (i > 100) {

            throw new Error("Trop de parties lancées");
        }

        this.redis.sadd("listeGameId", id)

        return id;
    }
}

module.exports = Gid
