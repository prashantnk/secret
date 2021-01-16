require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const { Passport } = require("passport");

const app = express();
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
}));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser: true, useUnifiedTopology: true });
const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    googleId: String, // for google strategy to save google id
    secret : String
});
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);
passport.use(User.createStrategy());
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());
// above only worked for local strategy now it will work for all
passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    //console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));
app.get("/auth/google", 
    passport.authenticate("google" , {scope : ["profile"]})
);
app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/secrets');
});

app.get("/", (req, res) => {
    res.render("home");
})
app.get("/login", (req, res) => {
    res.render("login");
})
app.get("/register", (req, res) => {
    res.render("register");
});
app.get("/submit" , (req , res)=>{
    if(req.isAuthenticated()) res.render("submit");
    else res.redirect("/login");
});
app.get("/secrets", (req, res) => {
    User.find({"secret" : {$ne: null }} , (err , found)=>{
        if(found) res.render("secrets" , {users : found});
        else res.render("secrets" , {users : [{secret : "NOTHING TO SHOW !"}]});
    })
    // if (req.isAuthenticated()) {
    //     res.render("secrets");
    // } else res.redirect("/login");
});
app.get("/logout" , (req , res)=>{
    req.logout();
    res.redirect("/");
});

app.post("/submit" , (req , res)=>{
    const secret = req.body.secret;
    User.findById(req.user._id , (err , found)=>{
        found.secret = secret;
        found.save();
        res.redirect("/secrets");
    });
});

app.post("/login", (req, res) => {
    const user = new User({
        username : req.body.username ,
        password : req.body.password
    });
    req.login(user , (err)=>{
        if(err) res.redirect("/login");
        else {
            passport.authenticate("local" , {failureRedirect: '/register'})(req, res, () => {
                res.redirect("/secrets");
            });
        }
    })
})

app.post("/register", (req, res) => {
    User.register({ username: req.body.username }, req.body.password, (err, newUser) => {
        if (err) console.log(err);
        else {
            passport.authenticate("local")(req, res, () => {
                res.redirect("/secrets");
            });
        }
    });
});

app.listen(3000, () => {
    console.log("server started at given port");
});