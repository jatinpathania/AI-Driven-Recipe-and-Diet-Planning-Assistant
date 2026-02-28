const mongoose= require('mongoose');

const connectDB= async()=>{
    try{
        if (!process.env.MONGODB_URI) {
            throw new Error("MONGODB_URI is not defined in the environment variables.");
        }
        const conn= await mongoose.connect(process.env.MONGODB_URI);
        console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    }
    catch(e){
        console.error(`❌ Error connecting to MongoDB: ${e.message}`);
        console.error("Please ensure your MongoDB service is running. If using local MongoDB, run 'net start MongoDB' in an Administrator terminal.");
        process.exit(1);
    }
}

module.exports= connectDB