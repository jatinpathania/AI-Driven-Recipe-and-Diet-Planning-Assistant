import mongoose from 'mongoose';
let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
    if(cached.conn) {
        return cached.conn;
    }
    if(!cached.promise){
        const opts = {
            bufferCommands: false,
        };

        cached.promise = mongoose.connect(process.env.MONGODB_URI || '', opts)
            .then((mongoose) => {
                console.log('MongoDB connected successfully');
                return mongoose;
            })
            .catch((error) => {
                console.error('Error connecting to MongoDB:', error.message);
                console.error('Please ensure your MongoDB service is running and MONGODB_URI is set correctly.');
                throw error;
            });
    }

    try{
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        throw e;
    }
    return cached.conn;
}

export default connectDB;