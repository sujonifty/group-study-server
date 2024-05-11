const express = require('express');
const cors = require('cors');
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



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.b9hcdyj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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


        const assignmentCollection = client.db('assignmentDB').collection('assignments');
        const submissionCollection = client.db('assignmentDB').collection('submittedAssignments');

        app.post('/addAssignment', async (req, res) => {
            const assignment = req.body;
            console.log(assignment);
            const result = await assignmentCollection.insertOne(assignment);
            res.send(result);
        })
        //for assignment submission
        app.post('/submittedAssignment', async (req, res) => {
            const submission = req.body;
            console.log(submission);
            const result = await submissionCollection.insertOne(submission);
            res.send(result);
        })

        //Assignments: get data from database
        app.get('/assignments', async (req, res) => {
            const cursor = assignmentCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })
        //my submission: get data from database
        app.get('/mySubmission/:email', async (req, res) => {
            const email = req.params.email;
            const query = { userEmail: email };
            const result = await assignmentCollection.find(query).toArray();
            res.send(result);
        })

        app.get('/cardDetails/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await assignmentCollection.findOne(query);
            res.send(result);
        })
        //find for update data
        app.get('/update/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await assignmentCollection.findOne(query);
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

        //delete section
        app.delete('/assignments/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await assignmentCollection.deleteOne(query);
            res.send(result);
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



