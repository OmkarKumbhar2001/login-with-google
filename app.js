require('dotenv').config();
const express=require("express");
const bodyparser=require("body-parser");
const ejs=require("ejs");
const mongoose=require("mongoose");
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate=require("mongoose-findorcreate");
// const LocalStrategy=require("passport-local")
// const encrypt=require("mongoose-encryption");
// const md5=require("md5");
// const bcrypt=require("bcrypt");
// const saltRounds=10;


const app=express();
app.use(express.static("public")) //for css
app.use(bodyparser.urlencoded({ extended: true }));
app.set("view engine", "ejs");

app.use(session({
    secret:"Our little secret.",
    resave:false,
    saveUninitialized:false,
    // cookie: { secure: true }
}));    
app.use(passport.initialize());
app.use(passport.session());


mongoose.connect("mongodb://localhost:27017/userDB");

const userloginfoSchema=new mongoose.Schema({
    userName:String,
    userPassword:String,
    googleId:String,
    secret:String
});

userloginfoSchema.plugin(passportLocalMongoose);
userloginfoSchema.plugin(findOrCreate);

// const secret=process.env.SECRET;
// userloginfoSchema.plugin(encrypt, { secret: secret,encryptedFields:["userPassword"]});

const userinfo=mongoose.model("Userinfo",userloginfoSchema);

passport.use(userinfo.createStrategy());

// passport.serializeUser(userinfo.serializeUser());
passport.serializeUser(function(user,done){
    done(null,user.id);
});
// passport.deserializeUser(userinfo.deserializeUser());
passport.deserializeUser(function(id,done){
    userinfo.findById(id,function(err,user){
        done(err,user);
    });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL:"https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
      console.log(profile);
    userinfo.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


app.get("/",function(req,res){
    res.render("home")
});

app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"] })
  ); //This is for grting google login screen to see emails

  app.get("/auth/google/secrets", 
  passport.authenticate('google', { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect('/secrets');
  });


app.get("/register",function(req,res){
    res.render("register")
});
app.get("/secrets",function(req,res){
    userinfo.find({"secret":{$ne:null}},function(err,foundUse){
        if(err){
            console.log(err)
        }else{
            if(foundUse){
                res.render("secrets",{usersWithSecrets:foundUse})
            }
        }
    })
});
app.get("/logout",function(req,res){
    req.logout();
    res.redirect("/")
});

app.get("/submit",function(req,res){
    if(req.isAuthenticated()){
        res.render("submit")
        console.log(req.user)
    }else{
        res.redirect("/login")
    }
});
app.post("/submit",function(req,res){
    const usersecret=req.body.secret;
    console.log(req.user.id);
    userinfo.findById(req.user.id,function(err,foundUser){
        if(err){
            console.log(err)
        }else{
            if(foundUser){
                foundUser.secret=usersecret;
                foundUser.save(function(){
                    res.redirect("/secrets")
                });
            }
        }
    });
});

app.post("/register",function(req,res){
    userinfo.register({username:req.body.username},req.body.password,function(err,user){
        if(err){
            console.log(err)
            console.log("errror is here")
            res.redirect("/register")
        }
        else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets")
            })
        }
    });
    // bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        // Store hash in your password DB.
        // const user=new userinfo({
        //     userName:req.body.username,
            // userPassword:md5(req.body.password)
        //     userPassword:hash
        // })
    //     user.save(function(err){
    //         if(err){
    //             console.log(err)
    //         }else{
    //             res.render("secrets")
    //         }
    //     });
    // });
    
    
});
app.get("/login",function(req,res){
    res.render("login")
});
app.post("/login",function(req,res){

    const user =new userinfo({
        username:req.body.username,
        password:req.body.password
    });
    req.login(user,function(err){
        if(err){
            console.log(err)
        }else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets")
            })
        }
    })
    //    let Name=req.body.username;
    //    let Password=md5(req.body.password);
    //    let Password=req.body.password;
    //     userinfo.findOne({userName:Name},function(err,omi){
    //      if(!err){
    //          if(!omi){
    //              res.redirect("/")
    //          }else{
    //             bcrypt.compare(Password, omi.userPassword, function(err, result) {
    //                 // result == true
    //                 if(result===true){
    //                     res.render("secrets");
    //                 }else{
    //                     res.send("Check your password or email")
    //                 }
    //             });
                // if(Name===omi.userName&&Password===omi.userPassword){
                //     res.render("secrets");
                // }
                // if(Name!=omi.userName||Password!=omi.userPassword){
                //     res.send("Correct your password or check your username")
                // }
            //  }
        //  }else{
        //     console.log(err)
        //  }  
        // });
});
app.listen(3000,function(req,res){
    console.log("Server started at point 3000")
});



