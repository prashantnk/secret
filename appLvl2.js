//jshint esversion:6
// using mongoose-encryption
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");
const app = express();
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");

mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser: true, useUnifiedTopology: true });
const userSchema = new mongoose.Schema({
    username: String,
    password: String
});

userSchema.plugin(encrypt , {secret : process.env.SECRET , encryptedFields : ["password"]});

const User = new mongoose.model("User", userSchema);


app.get("/", (req, res) => {
    res.render("home");
})

app.get("/login", (req, res) => {
    res.render("login");
})
app.get("/register", (req, res) => {
    res.render("register");
});

app.post("/login", (req, res) => {
    User.findOne({ username: req.body.username }, (err, found) => {
        if (err) console.log(err);
        else {
            if (!found) res.redirect("/register");
            else {
                if (found.password == req.body.password) res.render("secrets");
                else res.redirect("/login");
            }
        }
    })
})

app.post("/register", (req, res) => {
    const newUser = new User({
        username: req.body.username,
        password: req.body.password
    });
    newUser.save(err => {
        if (err) console.log(err);
        else res.render("secrets");
    });
});



app.listen(3000, () => {
    console.log("server started at given port");
});