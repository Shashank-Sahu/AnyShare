require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const _ = require("lodash");
const mongoose = require("mongoose");
const passport = require("passport");
const session = require("express-session");
const passportLocalMongoose = require("passport-local-mongoose");
const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

/////////////////////////////////////DataBase Handling////////////////////////////////////

mongoose.connect("mongodb://localhost:27017/BlogDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const blogsSchema = new mongoose.Schema({
    heading: {
        type: String,
        required: true,

    },
    infoText: {
        type: String,
        required: true,
    },
});

const userSchema = new mongoose.Schema({
    username: String,
    password: String
});

userSchema.plugin(passportLocalMongoose);

const Blogs = new mongoose.model("Blog", blogsSchema);
const RequestBlog = new mongoose.model("Request", blogsSchema);
const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

/////////////////////////////////////Site Rendering/Redirecting////////////////////////////////////

app.get("/", function (req, res) {
    res.redirect("any-share");
});

app.get("/any-share", function (req, res) {
    Blogs.find({}, function (err, data) {
        res.render("any-share", { content: data });
    });
});

app.get("/share", function (req, res) {
    res.render("share");

});

app.get("/any-share/:titleUrl", function (req, res) {

    const title = _.lowerCase(req.params.titleUrl);

    Blogs.find({}, function (err, data) {
        data.forEach(function (blog) {
            const heading = _.lowerCase(blog.heading);
            if (title === heading) {
                res.render("share-page", { content: blog });
            }
        });
    });
});

app.route("/admin")
    .get(function (req, res) {
        if (req.isAuthenticated())
            res.render("admin");
        else
            res.redirect("/password");
    })
    .post(function (req, res) {
        const link = req.body.link;
        if (link === "edit")
            res.redirect("/admin/edit");
        else if (link === "requests")
            res.redirect("/admin/requests");
    });

app.get("/admin/requests", function (req, res) {
    if (req.isAuthenticated()) {
        RequestBlog.find({}, function (err, data) {
            res.render("edit", { content: data, link: "requests" });
        });
    }
    else
        res.redirect("/password");
});

app.get("/admin/edit", function (req, res) {
    if (req.isAuthenticated()) {
        Blogs.find({}, function (err, data) {
            res.render("edit", { content: data, link: "edit" });
        });
    }
    else
        res.redirect("/password");
});

app.route("/password").
    get(function (req, res) {
        if (req.isAuthenticated())
            res.redirect("/admin");
        else
            res.render("password");
    })
    .post(function (req, res) {
        const user = new User({
            username: req.body.username,
            password: req.body.password
        });

        req.login(user, function (err) {
            if (err)
                console.log(err);
            passport.authenticate("local")(req, res, function () {
                res.redirect("/admin");
            });
        });
    });

app.post("/share", function (req, res) {
    const contentHeading = req.body.heading;
    const contentInfoText = req.body.infoText;
    const blog = new RequestBlog({
        heading: contentHeading,
        infoText: contentInfoText,
    });
    blog.save();
    res.redirect("/any-share")
});

app.post("/processing", function (req, res) {
    const link = req.body.link;
    const acpt_id = req.body.acpt_id;
    const dlt_id = req.body.dlt_id;
    if (link === "edit") {
        Blogs.findByIdAndRemove(dlt_id, function (err) {
            if (err)
                console.log(err);
        });
        res.redirect("/admin/" + link);
    }
    else if (link === "requests") {
        if (dlt_id) {
            console.log("what");
            RequestBlog.findByIdAndRemove(dlt_id, function (err) {
                if (err)
                    console.log(err);
            });
        }
        else if (acpt_id) {
            RequestBlog.findById(acpt_id, function (err, acptBlog) {
                const blog = new Blogs(acptBlog.toJSON());
                blog.save();
            });
            RequestBlog.findByIdAndRemove(acpt_id, function (err) {
                if (err)
                    console.log(err);
            });
        }
        res.redirect("/admin/" + link);
    }
});

app.listen(3000, function () {
    console.log("Server started at 3000");
});

