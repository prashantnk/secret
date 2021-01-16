require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
// const md5 = require("md5");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const app = express();
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");

mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser: true, useUnifiedTopology: true });
const userSchema = new mongoose.Schema({
    username: String,
    password: String
});

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
                bcrypt.compare(req.body.password , found.password , (err , ok)=>{
                    if(ok) res.render("secrets");
                    else res.redirect("/login");
                });
            }
        }
    })
})

app.post("/register", (req, res) => {
    bcrypt.hash(req.body.password , saltRounds , (err , newHash)=>
    {
        if(err) console.log(err);
        else {
            const newUser = new User({
                username: req.body.username,
                password : newHash
            });
            newUser.save(err => {
                if (err) console.log(err);
                else res.render("secrets");
            });
        }  
    });
});

app.listen(3000, () => {
    console.log("server started at given port");
});