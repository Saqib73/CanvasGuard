import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const connectToMongoDB = async() =>{
    try {
        // The database name is part of MONGO_URL (e.g. .../canvasguard-dev); none means "test"
        await mongoose.connect(process.env.MONGO_URL);
        console.log("connected to mongodb")
    } catch (error) {
        console.log("Error connecting to mongodb-->", error);
    }
}

export  {connectToMongoDB};