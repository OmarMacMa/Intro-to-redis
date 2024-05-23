const redis = require("redis");
const { promisify } = require("util");

const redisClient = redis.createClient({
    url: "redis://localhost:7777"
});

redisClient.on("error", (err) => {
    console.error(err);
});

redisClient.on("connect", () => {
    console.log("Connected to Redis");
});

redisClient.on("end", () => {
    console.log("Redis connection closed");
});

const getAsync = promisify(redisClient.get).bind(redisClient);

function closeRedis() {
    redisClient.quit();
}

module.exports = { redisClient, getAsync, closeRedis };
