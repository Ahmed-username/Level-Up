const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require('cors');
const igdb = require('igdb-api-node').default;
const pgp = require('pg-promise')();

const bcrypt = require('bcrypt');
const passport = require('passport');
const cookieParser = require('cookie-parser');
const expressSession = require('express-session');
const LocalStrategy = require('passport-local').Strategy;


app.use(bodyParser.json());
app.use("/static", express.static("static"));
app.use(cookieParser());
app.use(require('express-session')({
  secret: 'some random text #^*%!!', // used to generate session ids
  resave: false,
  saveUninitialized: false
}));

// Database connection
const db = pgp({
  host: "localhost",
  port: 5432,
  database: process.env.DATABASE,
  user: process.env.USERNAME,
  password: process.env.PASSWORD
});

// Login starts

const SALT_ROUNDS = 12;

/* helper function to get user by username */
function getUserByUsername(username) {
  // console.log('2. Load user by username from (DB)');
  return db.one(`SELECT * FROM gamer WHERE gamer_name = $1`, [username])
    .catch(error => console.log(error.message));
}

function getUserById(id) {
  return db.one(`SELECT * FROM gamer WHERE id = $1`, [id])
    .catch(error => console.log(error.message));
}

///////////////// Ahmed - start //////////////////
app.get("/api/forum", function (req, res) {
  db.any(`SELECT * FROM forum`)
    .then(data => {
      res.json(data)
    })
    .catch(error => console.log(error.message));
});

app.get("/api/forum/:id", function (req, res) {
  db.one(`SELECT * FROM forum WHERE id = $1`, [req.params.id])
    .then(data => {
      res.json(data)
    })
    .catch(error => console.log(error.message));
});

app.get("/api/post/:id", function (req, res) {
  db.any(`SELECT * FROM post WHERE parent_id is null AND forum_id = $1`, [req.params.id])
    .then(data => {
      res.json(data)
    })
    .catch(error => console.log(error.message));
});

app.get("/api/parentpost/:id", function (req, res) {
  db.one(`SELECT * FROM post WHERE id = $1`, [req.params.id])
    .then(data => {
      res.json(data)
    })
    .catch(error => console.log(error.message));
});

app.get("/api/reply/:id", function (req, res) {
  db.any(`SELECT * FROM post WHERE parent_id = $1`, [req.params.id])
    .then(data => {
      res.json(data)
    })
    .catch(error => console.log(error.message));
});

///////////////// Ahmed - end //////////////////

// Database connection test ends

function compare(plainTextPassword, hashedPassword) {
  return bcrypt.compare(plainTextPassword, hashedPassword)
    .then(matches => {
      // matches will be true if plain text password is the same as hashedPassword once it has been hashed.
      return matches;
    });
}

// serialise user into session
passport.serializeUser(function (user, done) {
  // console.log('4. Extract user id from user for serialisation');
  done(null, user.id);
});

// deserialise user from session
passport.deserializeUser(function (id, done) {
  // console.log('5. Use user id to load user from DB');
  getUserById(id)
    .then(user => {
      done(null, user);
    });
});

// configure passport to use local strategy
// that is use locally stored credentials
passport.use(new LocalStrategy(
  function (username, password, done) {
    // console.log('1. Receive username and password');
    let _user;
    getUserByUsername(username)
      .then(user => {
        if (!user) return done(null, false);
        _user = user;
        return compare(password, user.password_hash);
      })
      .then(passwordMatches => {
        if (!passwordMatches) return done(null, false);
        return done(null, _user);
      })
      .catch(error => done(error, false));;
  }
));


// initialise passport and session
app.use(passport.initialize());
app.use(passport.session());

// middleware function to check user is logged in
function isLoggedIn(req, res, next) {
  // console.log('6. Check that we have a logged in user before allowing access to protected route');
  if (req.user && req.user.id) {
    next();
  } else {
    res.redirect('/login');
  }
}

// route to log out users
app.get('/logout', function (req, res) {
  // console.log('7. Log user out');
  // log user out and redirect them to home page
  req.logout();
  res.redirect('/');
});

// Login ends


// only accessible to logged in users
app.get('/dashboard', isLoggedIn, function (req, res) {
  res.render('index', { data: JSON.stringify({ username: req.user.gamer_name }) });
});

// app.use(cors());

const client = igdb("96651c2677f60060f3a91ef002c2a419");

app.set("view engine", "hbs");

// app.get("/", function (req, res) {
//   res.render("index", {});
// });

app.get("/", function (req, res) {
  res.render("landing", {});
});

app.get("/homepage", function (req, res) {
  res.render("index", {});
});

app.get("/login", function (req, res) {
  res.render("login", {});
});
// route to accept logins
app.post('/login', passport.authenticate('local', { session: true }), function (req, res) {
  res.status(200).end();
});

// register page
app.get('/signup', function (req, res) {
  res.render('signup', {});
})

app.post("/signup", (req, res) => {
  const { signupUsername, signupPassword, signupEmail } = req.body;
  pass = signupPassword;
  bcrypt.genSalt(SALT_ROUNDS)
    .then(salt => {
      return bcrypt.hash(signupPassword, salt);
    })
    .then(hashedPassword => {
      db.one(`
              INSERT INTO gamer (gamer_name, password_hash, email)
              VALUES ($1, $2, $3)
        `, [signupUsername, hashedPassword, signupEmail])
        .then(data => {
          console.log("data", data);
          // res.json(data)
        })
        .catch(error => console.log("Gamer already exist: ", error.message));
    });
});

app.get("/games/:title", (req, res) => {
  const gameTitle = req.params.title;
  client
    .games({
      search: gameTitle,
      // fields: 'id,name,summary,cover.url,rating,aggregated_rating,cover', // Return all fields
      fields: "*",
      limit: 5, // Limit to 5 results
      offset: 15 // Index offset for results
    })
    .then(response => {
      // response.body contains the parsed JSON response to this query

      displayData(res, response);
    })
    .catch(error => {
      console.log("You have 2 lives remaining ", error);
    });
});

app.get("/gameid/:id", (req, res) => {
  const gameTitle = req.params.id;
  client
    .games({
      ids: [gameTitle],
      fields: "id,name,summary,cover.url,rating,aggregated_rating,cover", // Return all fields
      limit: 5, // Currentlyl imited to 5 results
      offset: 15 // Index offset for results
    })
    .then(response => {
      // response.body contains the parsed JSON response to this query

      displayData(res, response);
    })
    .catch(error => {
      console.log("You have 2 lives remaining ", error);
    });
});
app.get("/reviews/:gameId", (req, res) => {
  const gameTitle = req.params.gameId;
  client
    .reviews({
      ids: [gameTitle], //try 2645 for an id
      // fields: 'id,title,review_rating,content,positive_points,negative_points', // Return all fields
      fields: "*",
      limit: 5, // Limit to 5 results
      offset: 15 // Index offset for results
    })
    .then(response => {
      // response.body contains the parsed JSON response to this query
      displayData(res, response);
    })
    .catch(error => {
      console.log("You have 2 lives remaining ", error);
    });
});

app.get("/themes", (req, res) => {
  const themeId = req.params.title;
  client
    .themes({
      fields: "id,name"
    })
    .then(response => {
      displayData(res, response);
    })
    .catch(error => {
      console.log("You have 2 lives remaining ", error);
    });
});

app.get("/genres", (req, res) => {
  client
    .genres({
      fields: "id,name" // Return all fields
    })
    .then(response => {
      // response.body contains the parsed JSON response to this query

      displayData(res, response);
    })
    .catch(error => {
      console.log("You have 2 lives remaining ", error);
    });
});

function displayData(res, data) {
  res.json(data);
}
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
  res.header("Access-Control-Allow-Origin", "Content-Type");
  next();
});


app.get("*", function (req, res) {
  res.render("index");
});

const port = process.env.PORT || 8081;
app.listen(port, function () {
  console.log(`Listening on port number ${port}`);
});