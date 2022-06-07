var express = require("express");
var app = express();

port = 3000;
var mongoose = require("mongoose");
var passport = require("passport");
var flash = require("connect-flash");
const dotenv = require("dotenv");

var morgan = require("morgan");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
var session = require("express-session");
const path = require("path");

const MongoStore = require("connect-mongo")(session);
var configDB = require("./Security/config/database");
app.use(bodyParser.urlencoded({ extended: true }));

app.use(bodyParser.json());

mongoose.connect(
  'mongodb+srv://akash:akash@123@cluster0.mcdux.mongodb.net/?retryWrites=true&w=majority',
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  () => {
    console.log("Connected to MongoDB");
  }
);

app.use(morgan("dev"));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());

app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({ mongooseConnection: mongoose.connection }),
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.use(require("./Security/routes/index"));
app.use("/auth", require("./Security/routes/auth"));

const config = require("./config");
module.exports = (app, express) => {
  app.post("/updatePromos", (req, res) => {
    // require('./index.js')(config.dev)
    // console.log('here')
    //res.send('Working')
    /*const config = require('./config.js')
        try {

            const _connectToDb = require('./utl/database');

            var connect = _connectToDb(async function (connection) {

                if (connection.isSuccess) {
                    console.log("---------- Connected to DB ----------");
                    global.dbIns = connection.db;

                }
            })



        } catch (e) {
            console.log("Not connected to Database - please contact administator ", e, e.message)
        }*/
  });
};

require("./Security/app/routes")(app, passport);
app.listen(port, () => {
  console.log(
    `Example app listening on port ${port} - http://127.0.0.1:1025/updatePromos `
  );
});
