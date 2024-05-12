const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const jwtAuth = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;


// middleware 
app.use(
    cors({
        origin: [
            "http://localhost:5173",
            "http://localhost:5174",
        ],
        credentials: true,
    })
);
app.use(express.json());
app.use(cookieParser());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.b9hcdyj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

// middlewares 
const logger = (req, res, next) => {
    console.log('log: info', req.method, req.url);
    next();
}

const tokenVerify = (req, res, next) => {
    const token = req?.cookies?.token;
    // console.log('token in the middleware', token);
    if (!token) {
        return res.status(401).send({ message: 'unauthorized access' });
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'unauthorized access' });
        }
        req.user = decoded;
        next();
    })
}
async function run() {
    try {


        const assignmentCollection = client.db('assignmentDB').collection('assignments');
        const submissionCollection = client.db('assignmentDB').collection('submittedAssignments');


        // ************ collection: assignments *********** 

        app.post('/addAssignment', async (req, res) => {
            const assignment = req.body;
            console.log(assignment);
            const result = await assignmentCollection.insertOne(assignment);
            res.send(result);
        })
        //Assignments: get assignments data from database
        app.get('/assignments', async (req, res) => {
            const cursor = assignmentCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })

        //update section
        app.put('/updateAssignment/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updatedAssign = req.body;
            const spot = {
                $set: {
                    title: updatedAssign.title,
                    mark: updatedAssign.mark,
                    photo: updatedAssign.photo,
                    level: updatedAssign.level,
                    time: updatedAssign.time,
                    description: updatedAssign.description,
                    userName: updatedAssign.authorName,
                    userEmail: updatedAssign.authorEmail,
                    editorName: updatedAssign.editorName,
                    editorPhoto: updatedAssign.editorPhoto,
                    editorEmail: updatedAssign.editorEmail,
                }
            }
            const result = await assignmentCollection.updateOne(filter, spot, options);
            res.send(result);
        })


        //find for update data
        app.get('/update/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await assignmentCollection.findOne(query);
            res.send(result);
        })
        //delete my assignment section
        app.delete('/assignments/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await assignmentCollection.deleteOne(query);
            res.send(result);
        })


        app.get('/cardDetails/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await assignmentCollection.findOne(query);
            res.send(result);
        })

        // ************ collection: assignments *********** 

        //for assignment submission
        app.post('/submittedAssignment', async (req, res) => {
            const submission = req.body;
            // console.log(submission);
            const result = await submissionCollection.insertOne(submission);
            res.send(result);
        })

        //Assignments: get submission assignments data from database
        app.get('/pendingAssignments',logger,tokenVerify, async (req, res) => {
            if (req.user.email !== req.query.email) {
                return res.status(403).send({ message: 'Forbidden access' });
            }
            const cursor = submissionCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })
        //set feedback & mark 
        app.put('/giveMark/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const setMark = req.body;
            const spot = {
                $set: {
                    feedback: setMark.feedback,
                    obtainMark: setMark.obtainMark,
                    status: setMark.status
                }
            }
            const result = await submissionCollection.updateOne(filter, spot, options);
            res.send(result);
        })


        //my submission: get data from database
        app.get('/mySubmission/:email', logger, tokenVerify,async (req, res) => {
            // console.log(req.query.email);
            if (req.user.email !== req.query.email) {
                return res.status(403).send({ message: 'Forbidden access' });
            }
            const email = req.params.email;
            const query = { examineeEmail: email };
            const result = await submissionCollection.find(query).toArray();
            res.send(result);
        })

        //delete my submission section
        app.delete('/submission/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await submissionCollection.deleteOne(query);
            res.send(result);
        })
        //JWT authentication
        app.post('/jwtAuth', async(req, res)=>{
            const user =req.body;
            const token = jwtAuth.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '120h' })
            res.cookie('token', token, {
                httpOnly: true,
                secure: true,
                sameSite: 'none'
            })
                .send({ success: true });
        })

        //clear token
        app.post('/remove', async (req, res) => {
            const user = req.body;
            console.log('log out', user);
            res.clearCookie('token', { maxAge: 0 }).send({ success: true })
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


app.get('/', (req, res) => {
    res.send('server is running');
})
app.listen(port, () => {
    console.log('server is running on port:', port);
})



