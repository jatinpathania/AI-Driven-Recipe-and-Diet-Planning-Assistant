const express = require("express")
const dotenv= require('dotenv')
const cors= require('cors')
const connectDB= require('./db/connectDB')
const recipeRouters= require('./Routes/recipeRoutes.js')

dotenv.config();
app.use(cors())
app.use(express.json());
const app= express();

app.listen(3000);