const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()

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

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const serviceCollection = client.db("banglaSystem").collection("carDoctor")

        const bookingCollection = client.db("banglaSystem").collection("bookings")

        //get bangla data from mongodb

        app.get('/services', async (req, res) => {

            const cursor = serviceCollection.find();
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

        app.get('/bookings', async (req, res) => {
            // console.log(req.query.email);
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
