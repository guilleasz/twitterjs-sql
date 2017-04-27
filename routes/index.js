'use strict';
var express = require('express');
var router = express.Router();
var db = require('../db');

module.exports = router;

// a reusable function
function respondWithAllTweets(req, res, next) {
    db.query(`SELECT tweets.id, users.name, users.picture_url, tweets.content FROM tweets
            INNER JOIN users ON tweets.user_id = users.id;`, function(err, result) {
        if (err) throw err;
        var allTheTweets = result.rows;
        res.render('index', {
            title: 'Twitter.js',
            tweets: allTheTweets,
            showForm: true
        });
    });
}


// here we basically treet the root view and tweets view as identical
router.get('/', respondWithAllTweets);

router.get('/tweets', respondWithAllTweets);

// search results
router.get('/search', function(req, res) {
    console.log(req.query.searchfor);
    db.query(`SELECT users.name, users.picture_url, tweets.content, tweets.id FROM tweets 
    INNER JOIN users ON tweets.user_id = users.id
    WHERE LOWER( tweets.content ) LIKE LOWER( '%${req.query.searchfor}%' )
    OR LOWER( users.name ) LIKE LOWER( '%${req.query.searchfor}%' );`, function(err, result) {
        if (err) throw err;
        //console.log(result);
        var searchResults = result.rows;
        res.render('index', {
            title: 'Twitter.js',
            tweets: searchResults,
            showForm: true
        });
    });

});

// single-user page
router.get('/users/:username', function(req, res, next) {
    db.query(`SELECT users.name, users.picture_url, tweets.content, tweets.id FROM users
              INNER JOIN tweets ON tweets.user_id = users.id
                AND users.name = '${req.params.username}';
            `, function(err, result) {
        if (err) throw err;
        var tweetsForName = result.rows;
        res.render('index', {
            title: 'Twitter.js',
            tweets: tweetsForName,
            showForm: true,
            username: req.params.username
        });
    });
});

// single-tweet page
router.get('/tweets/:id', function(req, res, next) {
    db.query(`SELECT users.name, users.picture_url, tweets.content, tweets.id FROM users
              INNER JOIN tweets ON tweets.user_id = users.id
                AND tweets.id = ${req.params.id};`,
        function(err, result) {
            if (err) throw err;
            var tweetsWithThatId = result.rows;
            res.render('index', {
                title: 'Twitter.js',
                tweets: tweetsWithThatId // an array of only one element ;-)
            });
        });
});

// create a new tweet
router.post('/tweets', function(req, res, next) {
    db.query(`SELECT id FROM users WHERE name = '${req.body.name}';`, function(err, result) {
        if (err) throw err;
        //      console.log(result);
        var nameExists = !!result.rows.length;
        if (!nameExists) {
            db.query(`INSERT INTO users (name) VALUES('${req.body.name}') RETURNING id;`, function(err, newUserResult) {
                if (err) throw err;
                db.query(`INSERT INTO tweets (user_id, content) VALUES(${newUserResult.rows[0].id}, '${req.body.content}');`, function(err) {
                    if (err) throw err;
                    res.redirect('/');
                });
            });

        } else {
            db.query(`INSERT INTO tweets (user_id, content) VALUES(${result.rows[0].id}, '${req.body.content}');`, function(err) {
                if (err) throw err;
                res.redirect('/');
            });
        }
    });
});

// // // replaced this hard-coded route with general static routing in app.js
// // router.get('/stylesheets/style.css', function(req, res, next){
// //   res.sendFile('/stylesheets/style.css', { root: __dirname + '/../public/' });
// // });