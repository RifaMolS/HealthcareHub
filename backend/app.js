const express = require("express");
const app = express();
const PORT = 5001;
const cors = require("cors")

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});
const dotenv = require("dotenv");
dotenv.config();

const database = require("./config/database")
const formRouter = require("./routes/healthrouter")
const path = require('path');

database()
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use("/health", formRouter);


app.listen(PORT, () => console.log("Server running on port " + PORT));