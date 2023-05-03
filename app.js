require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const { error } = require("console");
const encrypt = require("mongoose-encryption");
//const md5 = require("md5"); 
const bcript = require("bcrypt")
const saltRounds = 10;
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
require('dotenv').config()

const app = express();

app.use(express.static("public"));  

app.use(bodyParser.urlencoded({
    extended : true
}))
app.set("view engine","ejs");

app.use(session({
    secret: 'keyboard cat.',
    resave: false,
    saveUninitialized: true,
    // cookie: { secure: true }
  }));

app.use(passport.initialize());
app.use(passport.session());



mongoose.connect("mongodb://localhost:27017/userDB");


const userSchema = new mongoose.Schema({
    email : String,
    password : String,
    googleId : String,
    name : String,
    secret : String

});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
// userSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:["password"]});



const User = mongoose.model("User",userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user,done){
    done(null,user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id)
    .then(function(user) {
      done(null, user);
    })
    .catch(function(err) {
      done(err, null);
    });
});

passport.deserializeUser(User.deserializeUser());

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL : "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id, name : profile.displayName}, function (err, user) {
        
        return cb(err, user);

    });
  }
));


app.get("/",function(req,res){
    res.render("home");
});


app.get("/login",function(req,res){
    res.render("login");
});

app.get("/register",function(req,res){
    res.render("register");
});

app.get("/auth/google",
  passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/plus.login',
  'https://www.googleapis.com/auth/userinfo.email']}));

app.get("/auth/google/secrets", 
  passport.authenticate('google', { failureRedirect: '/login'}),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  });

  app.get("/secrets", function(req, res) {
    User.find({ "secret": { $ne: null } }).then(function(results) {
      res.render("secrets", { usersSecrets: results });
    });
  });
  
app.get("/submit",function(req,res){
    if(req.isAuthenticated()){
        res.render("submit");
    }
    else{
        res.redirect("/login");
    }
})

app.post("/submit",function(req,res){
    const submittedSecret = req.body.secret;
    console.log(req.user);
    User.findById(req.user.id)
    .then(function(data){
        data.secret = submittedSecret;
        data.save();
        res.redirect("/secrets");
            
    });
    

});

app.post("/register",function(req,res){
    
    User.register({username : req.body.username},req.body.password,function(err,user){
        if(err){
            console.log(err);
            res.redirect("/register");
        }
        else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            });
        }
    });

    
    
    
    
    
    
    
    
    
    
    
    
    
    
    // bcript.hash(req.body.password,saltRounds,function(err,hash) {
    //     const newUser = new User({
    //         email : req.body.username,
    //         // password : md5(req.body.password)
    //         //password : (req.body.password)
    //         password : hash
            
    //     });
    //     newUser.save()
    //     .then(function()    {
    //         res.render("secrets");
    //     })
    //     .catch(function(error){
    //         console.log(error);
    //     })
    // });
    

    
});

app.get("/logout",function(req,res){
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/');
      });
});

app.post("/login",function(req,res){
    
    const user = new User({
        username : req.body.username,
        password : req.body.password
    });

    req.logIn(user,function(err){
        if(err){
            console.log(err);
        }
        else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            });
        }
    })
    
    // User.findOne({email :username})
    //     .then(function(response){
    //         if(!response){
    //             console.log(response);
    //         }
    //         else{
    //             bcript.compare(password,response.password,function(err,result){
    //                 if(result === true)
    //                 res.render("secrets");
    //             });
                    
    //             }
    //         }
    //     );
    
});

app.listen(3000,function(){
    console.log("serevr running in port 3000");
})

