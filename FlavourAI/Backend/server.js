const express = require("express")
const dotenv= require('dotenv')
const cors= require('cors')
const PORT= process.env.PORT || 3000;
const connectDB= require('./db/connectDB')
const recipeRouters= require('./Routes/recipeRoutes.js')
const app= express();
dotenv.config();


app.use(cors())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

connectDB();

app.listen(PORT, ()=>{
    console.log(`Server started at port ${PORT}`)
});