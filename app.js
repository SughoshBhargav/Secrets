require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const { error } = require("console");
const encrypt = require("mongoose-encryption");



const app = express();

app.use(express.static("public"));  
app.use(bodyParser.urlencoded({
    extended : true
}))
app.set("view engine","ejs");


mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema({
    email : String,
    password : String
});


userSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:["password"]});


const User = mongoose.model("User",userSchema);


app.get("/",function(req,res){
    res.render("home");
});


app.get("/login",function(req,res){
    res.render("login");
});

app.get("/register",function(req,res){
    res.render("register");
});

app.post("/register",function(req,res){
    const newUser = new User({
        email : req.body.username,
        password : req.body.password
    });

    newUser.save()
        .then(function()    {
            res.render("secrets");
        })
        .catch(function(error){
            console.log(error);
        })
});

app.post("/login",function(req,res){
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({email :username})
        .then(function(response){
            if(!response){
                console.log(response);
            }
            else{
                if(response.password === password){
                    res.render("secrets");
                }
            }
        })
    
});

app.listen(3000,function(){
    console.log("serevr running in port 3000");
})

