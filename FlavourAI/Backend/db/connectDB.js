const mongoose= require('mongoose');

const connectDB= async()=>{
    try{
        if(!process.env.MONGODB_URI){
            throw new Error('MONGODB_URI is not defined in the .env file');
        }
        const conn= await mongoose.connect(process.env.MONGODB_URI);
        console.log(`MongoDB connected ${conn.connection.host}`);
    }
    catch(e){
        console.log(`Error connecting to MongoDB : ${e.message}`);
        process.exit(1);
    }
}

module.exports= connectDB