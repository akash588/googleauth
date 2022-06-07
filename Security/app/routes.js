// app/routes.js


module.exports = function(app, passport) {
    const config = require('../../config')
    require('../config/passport')(passport)
    // route for home page
    app.get('/', function(req, res) {
    console.log(req.user)
        res.render('index.ejs'); // load the index.ejs file
    });

    // route for showing the profile page
    app.get('/profile', isLoggedIn, function(req, res) {
       
        res.render('home.ejs', {
            user: req.user // get the user out of session and pass to template
        });
    });

    app.post('/updatePromos', isLoggedIn, function(req, res)  {
        require('../../index')(config.dev)
        console.log('here')


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
    })
  

 

    // =====================================
    // GOOGLE ROUTES =======================
    // =====================================
    // send to google to do the authentication
    // profile gets us their basic information including their name
    // email gets their emails
    app.get('/auth/google', passport.authenticate('google', {
        scope: ['profile', 'email']
    }));

    // the callback after google has authenticated the user
    app.get('/auth/google/callback',
        passport.authenticate('google', {
            successRedirect: '/profile',
            failureRedirect: '/'
        }));

    
    

    

    // route for logging out
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

};

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}