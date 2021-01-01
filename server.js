// importing..
import express from 'express';
import mongoose from 'mongoose';
import messagedetails from './dbMessages.js';
import roomdetails from './dbRooms.js';
import Pusher  from 'pusher';
import cors from 'cors';

// app configs..
const app = express();
const port = process.env.PORT || 9000;

const mongoDBUsername = "admin";
const mongoDBPassword = "9gAwOLZp2eckcbF3";
const mongoDBName = "whatsappdb";
const mongoDBConnectionURL = `mongodb+srv://${mongoDBUsername}:${mongoDBPassword}@cluster0.pooz4.mongodb.net/${mongoDBName}?retryWrites=true&w=majority`;
const pusher = new Pusher({
    appId: "1131081",
    key: "afffa0c8d4e515389269",
    secret: "d2134b8614df9f874adc",
    cluster: "us3",
    useTLS: true
});

// middleware....
app.use(express.json());

// STRICTLY FOR DEVELOPMENT PURPOSE ONLY..
app.use(cors());
// app.use((req,res,next) => {
//     res.setHeader("Access-Control-Allow-Origin", "*");
//     res.setHeader("Access-Control-Allow-Headers", "*");
//     next();
// });

// db config...
mongoose.connect(mongoDBConnectionURL, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;

db.once("open", () => {
    console.log("DB Connected..");

    const messageCollection = db.collection("messagedetails");
    const changeStream = messageCollection.watch();

    const roomCollection = db.collection("roomdetails");
    const roomChangeStream = roomCollection.watch();

    roomChangeStream.on("change", (change) => {
        console.log("A Change Occured in room stream: ", change);

        if(change.operationType === "insert") {
            const roomDetails = change.fullDocument;
            pusher.trigger('rooms', 'inserted', {
                id: roomDetails._id,
                data: {
                    name: roomDetails.name,
                    createdBy: roomDetails.createdBy,
                    timestamp: roomDetails.timestamp
                }
            })
        }
        else {
            console.log("Error triggering room pusher...");
        }
    })

    changeStream.on("change", (change) => {
        console.log("A Change Occured in message stream: ", change);

        if(change.operationType === "insert") {
            const messageDetails = change.fullDocument;
            pusher.trigger('messages', 'inserted', {
                id: messageDetails._id,
                roomId: messageDetails.roomId,
                name: messageDetails.name,
                message: messageDetails.message,
                timestamp: messageDetails.timestamp,
                received: messageDetails.received
            })
        }
        else {
            console.log("Error triggering room pusher...");
        }
    });
})

// api routes..
app.get("/", (req, res) => res.status(200).send("Hello world.."));


app.post("/rooms/new", (req,res) => {
    const dbMessage = req.body;
    roomdetails.create(dbMessage, (err, data) => {
        if(err) 
            res.status(500).send(err);
        else
            res.status(201).send(data);
    })
});

app.post("/message/new", (req,res) => {
    const dbMessage = req.body;
    messagedetails.create(dbMessage, (err, data) => {
        if(err) 
            res.status(500).send(err);
        else
            res.status(201).send(data);
    })
});

app.get("/rooms/sync", (req,res) => {
    roomdetails.find((err,data) => {
        if(err)
            res.status(500).send(err);
        else
            res.status(200).send(data);
    })
})

app.get("/message/sync", (req,res) => {
    messagedetails.find((err,data) => {
        if(err)
            res.status(500).send(err);
        else
            res.status(200).send(data);
    })
})

app.post("/rooms/roomId", (req,res) => {
    const roomId = req.body.roomId;
    roomdetails.findById(roomId, (err, data) => {
        if(err)
            res.status(500).send(err);
        else
            res.status(200).send(data);
    });
})

app.post("/message/getMessageByRoomId", (req,res) => {
    const roomId = req.body.roomId;
    messagedetails.find({roomId: roomId}, (err, data) => {
        if(err)
        res.status(500).send(err);
    else
        res.status(200).send(data);
    });
})

// listening..
app.listen(port, () => console.log("Listeening to ", port));