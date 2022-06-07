// import all the things we need  
const GoogleStrategy = require('passport-google-oauth20').Strategy
const mongoose = require('mongoose')
const User = require('../app/models/user')
const dotenv = require('dotenv')
const express = require('express')
const router = express.Router()

module.exports = function (passport) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: '496088742171-h60pkqu9bvs4q5upv0rpk0mtiv0m4hbr.apps.googleusercontent.com',
        clientSecret: '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',
        callbackURL: '/auth/google/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        //get the user data from google 
        const newUser = {
          googleId: profile.id,
          displayName: profile.displayName,
          firstName: profile.name.givenName,
          lastName: profile.name.familyName,
          image: profile.photos[0].value,
          email: profile.emails[0].value
        }

        try {
          //find the user in our database 
          // let user = await User.findOne({ googleId: profile.id })
          // code to check if it belongs to kggroup
          if(!(profile.emails.find(item => item.value.indexOf("kgelectronic") > -1) || profile.emails.find(item => item.value.indexOf("kggroup") > -1))) {
           
            
            throw new Error("not allowed");
          }

          // if (user) {
          //   //If user present in our database.
          //   done(null, user)
          // } else {
          //   // if user is not preset in our database save user data to database.
            
          //   done(null, user)
          // }
        } catch (err) {
          console.error(err)
        }
      }
    )
  )

  // used to serialize the user for the session
  passport.serializeUser((user, done) => {
    done(null, user.id)
  })

  // used to deserialize the user
  passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => done(err, user))
  })
}


