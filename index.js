const express = require('express')
require('dotenv').config()
const cors = require('cors');
const jwt = require('jsonwebtoken');
const ObjectId = require('mongodb').ObjectId
const { MongoClient, ServerApiVersion } = require('mongodb');

const port = process.env.PORT || 5000
const app = express()


// middleware
app.use(cors())
app.use(express.json())



function jwtVerify(req, res, next) {
    const authHeader = req.headers.authorization
    if (!authHeader) {
        return res.status(401).send({ message: 'Access denied! unauthorized access' })
    }

    else {
        const token = authHeader.split(' ')[1]
        jwt.verify(token, process.env.ACCESS_JWTTOKEN, (err, decoded) => {
            if (err) {
                return res.status(403).send({ message: 'Access denied! Forbidden access' })
            }
            console.log('decoded', decoded);
            req.decoded = decoded
        })
        next()
    }
}



const uri = `mongodb+srv://${process.env.FASHIONFLAVOUR_USER}:${process.env.FASHIONFLAVOUR_PASS}@cluster0.mvgy0.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });



const run = async () => {

    try {

        await client.connect();
        const productsCollection = client.db('fashionFlavour').collection('dress')


        // jwt
        app.post('/signup', async (req, res) => {
            const user = req.body
            const accessJwtToken = jwt.sign(user, process.env.ACCESS_JWTTOKEN, {
                expiresIn: '10d'
            })
            res.send({ accessJwtToken })
        })
        app.post('/login', async (req, res) => {
            const user = req.body
            const accessJwtToken = jwt.sign(user, process.env.ACCESS_JWTTOKEN, {
                expiresIn: '10d'
            })
            res.send({ accessJwtToken })
        })

        // All product get
        app.get('/dress', async (req, res) => {
            const page = parseInt(req.query.page)
            const size = parseInt(req.query.size)

            const query = {}
            const cursor = productsCollection.find(query)
            let result
            if (page || size) {
                result = await cursor.skip(page * size).limit(size).toArray()

            }
            else {
                result = await cursor.toArray()
            }
            res.send(result)
        })


        app.get('/productCount', async (req, res) => {
            const count = await productsCollection.estimatedDocumentCount()
            res.send({ count })
        })

        // Get product by id
        app.get('/dress/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: id };
            const result = await productsCollection.findOne(query)
            res.send(result);
        });

        // Post product
        app.post('/dress', async (req, res) => {
            const query = req.body
            const result = await productsCollection.insertOne(query)
            res.send(result)
        })

        // Filter product by email
        app.get('/mydress', jwtVerify, async (req, res) => {
            const emailDecoded = req.decoded.email
            const email = req.query.email
            if (email === emailDecoded) {
                const query = { email: email }
                const result = await productsCollection.find(query).toArray()
                res.send(result)
            }
            else {
                res.status(403).send({ message: 'Access denied! Forbidden access' })
            }
        })


        // put for upadet quantity 
        app.put('/dress/:id', async (req, res) => {
            const id = req.params.id
            const updatedQuantity = req.body.updatedData
            const filter = { _id: id }
            const options = { upsert: true }
            const updatedDoc = {
                $set: {
                    quantity: updatedQuantity
                }
            }
            const result = await productsCollection.updateOne(filter, updatedDoc, options)
            res.send(result)
        })


        // Delete product
        app.delete('/dress/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const results = await productsCollection.deleteOne(query)
            res.send(results)
        })

    }
    finally { }
}

run().catch(console.dir)



app.get('/', (req, res) => {
    res.send('hey bro !! I am working');
})

app.listen(port, () => {
    console.log('Listning to port', port);
})