const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion , ObjectId } = require('mongodb');
require('dotenv').config()
const port =process.env.PORT || 5000 ;

const app = express() ;

app.use(cors()) ;
app.use(express.json()) ;

function verifyJWT(req , res , next) {
    const authHeaders=req.headers.authorization;

    if(!authHeaders) {
        return res.status(401).send({message: 'unauthorized access'}) ;
    }

    const token = authHeaders.split(' ')[1];
    jwt.verify(token , process.env.ACCESS_TOKEN_SECRET , (err , decoded) => {
        if(err) {
            return res.status(403).send({message: 'forbidden access'}) ;
        }

        console.log('decoded' , decoded) ;
        req.decoded = decoded ;
    })
    console.log('inside verifyJWT',authHeaders);
    next() ;

}


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ocv76.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect() ;
        const serviceCollection = client.db('GeniousCar').collection('services') ;
        const orderCollection = client.db('GeniousCar').collection('order') ;

        app.get('/service', async (req , res) => {

            const query = {} ;
            const cursor = serviceCollection.find(query) ;
            const services = await cursor.toArray() ;
            res.send(services) ;
        })

        app.get('/service/:id' , async(req , res)=> {
            const id = req.params.id;
            const query = {_id : ObjectId(id)} ;
            const service = await serviceCollection.findOne(query) ;

            res.send(service);
        })


        // post

        app.post('/service' ,async (req , res) => {
            const newService = req.body ;
            const result = await serviceCollection.insertOne(newService) ;

            res.send(result) ;
        } )


        // ACCESS tOKEN AUTH

        app.post('/login' , (req , res)=> {
            const user = req.body;
            const accessToken = jwt.sign(user , process.env.ACCESS_TOKEN_SECRET , {
                expiresIn:'1d'
            }) ;

            res.send({accessToken});
        })


        app.delete('/service/:id' , async(req , res) => {
            const id = req.params.id ;
            const query = {_id : ObjectId(id)} ;
            const result = await serviceCollection.deleteOne(query);

            res.send(result);
        })

        app.post('/order' , async(req , res) => {
            const order = req.body ;
            const result = await orderCollection.insertOne(order);
            res.send(result);
        })

        // order collection api

        app.get('/order' , verifyJWT ,async(req , res)=>{
            const decodedEmail = req.decoded.email ;
            const email = req.query.email;

            if(email === decodedEmail) {
                const query={email: email} ;
                const cursor = orderCollection.find(query);
                const orders = await cursor.toArray();
                res.send(orders); 
            }

            else {
                res.status(403).send({message: 'forbidden access'}) ;
            }
            
        })
    }

    finally {

    }
}

run().catch(console.dir);




app.get('/' , (req , res) => {
    res.send('genius car is running') ;
})

app.listen(port , () => {
    console.log('Listen to port' , port) ;
})
