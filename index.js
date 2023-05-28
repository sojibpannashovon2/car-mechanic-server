const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const jwt = require("jsonwebtoken")

const express = require('express');
const app = express()
const cors = require('cors');
const port = process.env.PORT || 7000

//midleware 

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
    res.send(`Car Meachanic is running baby`)
})



const uri = `mongodb+srv://${process.env.CAR_USER}:${process.env.CAR_PASS}@cluster0.yaanftr.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const verifyJWT = (req, res, next) => {
    console.log("Verify JWT is Hitting");
    // console.log(req.headers.authorization);

    const authorization = req.headers.authorization;

    if (!authorization) {
        return res.status(401).send({ error: true, message: "Unauthorized Access !!!" })
    }
    const token = authorization.split(" ")[1]
    // console.log('Token is Verified ', token);
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
        if (error) {
            return res.status(403).send({ error: true, message: "Unauthorized Access !!!" })
        }
        req.decoded = decoded;
        next();
    })
}

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const serviceCollection = client.db("banglaSystem").collection("carDoctor")

        const bookingCollection = client.db("banglaSystem").collection("bookings")

        // JWTS ROUTES 

        app.post("/jwt", (req, res) => {

            const user = req.body;
            // console.log(user);
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: "1h"
            });

            res.send({ token })
        })

        //get bangla data from mongodb

        app.get('/services', async (req, res) => {
            const sort = req.query.sort
            const search = req.query.search
            console.log(search);
            const query = { title: { $regex: search, $options: "i" } };
            // const query = { price: { $gte: 50, $lte: 200 } };
            // const query = { price: { $lt: 100 } };
            const options = {
                // sort matched documents in descending order by rating
                sort: {
                    "price": sort === "asc" ? 1 : -1
                },

            };

            const cursor = serviceCollection.find(query, options);
            const result = await cursor.toArray()
            res.send(result)
        })

        //get specific  data from mongodb

        app.get("/services/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }

            const options = {

                // Include only the `title` and `imdb` fields in the returned document
                projection: { title: 1, img: 1, price: 1 },

            };
            const result = await serviceCollection.findOne(query, options)
            res.send(result)
        })


        //get booking data from mongodb

        app.get('/bookings', verifyJWT, async (req, res) => {


            // console.log("come back after decoded", req.decoded);

            if (req.decoded.email !== req.query.email) {
                return res.status(403).send({ error: 1, message: "Forbiden Access !!!" })
            }
            let query2 = {};
            if (req.query?.email) {
                query2 = { email: req.query.email }
            }

            const result = await bookingCollection.find(query2).toArray();
            res.send(result)
        })

        //another post  booking data into mongodb

        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            const result = await bookingCollection.insertOne(booking);
            res.send(result)
            console.log(booking);
        })

        // delete data from mongodb

        app.delete("/bookings/:id", async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const query = { _id: new ObjectId(id) }
            const result = await bookingCollection.deleteOne(query)
            res.send(result)
            console.log(result);
        })

        // update single  mongodb data

        app.patch('/bookings/:id', async (req, res) => {
            const updateBooking = req.body;
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    status: updateBooking.status
                },
            }
            console.log(updateBooking);
            const result = await bookingCollection.updateOne(filter, updateDoc);
            res.send(result)
        })

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.listen(port, () => {
    console.log(`The car mechanic is running at port: ${port}`);
})
