require('dotenv').config();
const express=require("express");
const bodyparser=require("body-parser");;
const ejs=require("ejs");
const mongoose=require("mongoose");
const encrypt=require("mongoose-encryption");


const app=express();
app.use(express.static("public")) //for css
app.use(bodyparser.urlencoded({ extended: true }));
app.set("view engine", "ejs");


mongoose.connect("mongodb://localhost:27017/userDB");

const userloginfoSchema=new mongoose.Schema({
    userName:String,
    userPassword:String
});

const secret=process.env.SECRET;
userloginfoSchema.plugin(encrypt, { secret: secret,encryptedFields:["userPassword"]});

const userinfo=mongoose.model("Userinfo",userloginfoSchema);

app.get("/",function(req,res){
    res.render("home")
});
app.get("/register",function(req,res){
    res.render("register")
});
app.post("/register",function(req,res){
    const user=new userinfo({
        userName:req.body.username,
        userPassword:req.body.password
    })
    user.save(function(err){
        if(err){
            console.log(err)
        }else{
            res.render("secrets")
        }
    });
});
app.get("/login",function(req,res){
    res.render("login")
});
app.post("/login",function(req,res){
       let Name=req.body.username;
       let Password=req.body.password;
        userinfo.findOne({userName:Name},function(err,omi){
         if(!err){
             if(!omi){
                 res.redirect("/")
             }else{
                if(Name===omi.userName&&Password===omi.userPassword){
                    res.render("secrets");
                }
                if(Name!=omi.userName||Password!=omi.userPassword){
                    res.send("Correct your password or check your username")
                }
             }
         }else{
            console.log(err)
         }  
        });
});











app.listen(3000,function(req,res){
    console.log("Server started at point 3000")
});