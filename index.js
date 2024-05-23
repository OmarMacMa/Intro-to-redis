const express = require('express');
const path = require('path');
const redis = require('redis');
const mongoose = require('mongoose');

const app = express();
const port = 3000;

const mongoDBURL = "mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+2.2.6";

mongoose.connect(mongoDBURL)
    .then(() => {
        console.log("Connected to the database");
    })
    .catch(err => {
        console.log("Cannot connect to the database", err);
        process.exit();
    });

const redisClient = redis.createClient({
    host: 'localhost',
    port: 7777,
});

(async () => {
    try {
        await redisClient.connect();
        console.log("Connected to Redis cache");
    } catch (err) {
        console.error("Error connecting to Redis:", err);
        process.exit();
    }
})();

app.use(express.static(path.join(__dirname, "public")));

app.get("/", async (req, res) => {
    res.sendFile(path.join(__dirname, "views", "index.html"));
});

app.get("/api/faqs", async (req, res) => {
    try {
        const myFAQDB = mongoose.connection.useDb("myFAQDB");
        const faqsCollection = myFAQDB.collection("faqs");
        const faqs = await faqsCollection.find({}).toArray();
        let faqsList = [];
        for (let i = 0; i < faqs.length; i++) {
            faqsList.push({
                id: faqs[i]._id,
                question: faqs[i].question,
            });
        }
        res.json(faqsList);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error retrieving FAQs");
    }
});

const cacheMiddleware = async (req, res, next) => {
    const faqId = req.params.id;
    const cacheKey = `faq:${faqId}`;

    try {
        const cachedFaq = await redisClient.get(cacheKey);
        if (cachedFaq) {
            console.log(`FAQ with ID ${faqId} retrieved from cache`);
            return res.json(JSON.parse(cachedFaq));
        }
    } catch (err) {
        console.error("Error checking cache:", err);
    }

    next();
};

app.get("/api/faqs/:id", cacheMiddleware, async (req, res) => {
    try {
        const faqId = req.params.id;
        const cacheKey = `faq:${faqId}`;
        const myFAQDB = mongoose.connection.useDb("myFAQDB");
        const faqsCollection = myFAQDB.collection("faqs");
        const faq = await faqsCollection.findOne({ _id: new mongoose.Types.ObjectId(faqId) });

        if (faq) {
            const faqData = {
                id: faq._id,
                question: faq.question,
                answer: faq.answer
            };

            try {
                await redisClient.set(cacheKey, JSON.stringify(faqData), {
                    EX: 3600
                });
                console.log(`FAQ with ID ${faqId} cached`);
            } catch (err) {
                console.error("Error caching FAQ:", err);
            }

            res.json(faqData);
        } else {
            res.status(404).send("FAQ not found");
        }
    } catch (err) {
        console.error(err);
        res.status(500).send("Error retrieving FAQ");
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
