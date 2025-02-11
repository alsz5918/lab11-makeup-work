// *****************************************************
// <!-- Section 1 : Import Dependencies -->
// *****************************************************

const express = require('express'); // To build an application server or API
const path = require('path');
const app = express();
const pgp = require('pg-promise')(); // To connect to the Postgres DB from the node server
const bodyParser = require('body-parser');
const session = require('express-session'); // To set the session object. To store or access session data, use the `req.session`, which is (generally) serialized as JSON by the store.
const bcrypt = require('bcrypt'); //  To hash passwords
//const axios = require('axios'); // To make HTTP requests from our server. We'll learn more about it in Part B.
const sdk = require('api')('@yelp-developers/v1.0#xtskmqwlofwyovu');

// *****************************************************
// <!-- Section 2 : Connect to DB -->
// *****************************************************

// database configuration
const dbConfig = {
    host: 'db', // the database server
    port: 5432, // the database port
    database: process.env.POSTGRES_DB, // the database name
    user: process.env.POSTGRES_USER, // the user account to connect with
    password: process.env.POSTGRES_PASSWORD, // the password of the user account
};

const db = pgp(dbConfig);

// test your database
db.connect()
    .then(obj => {
        console.log('Database connection successful'); // you can view this message in the docker compose logs
        obj.done(); // success, release the connection;
    })
    .catch(error => {
        console.log('ERROR:', error.message || error);
    });

// *****************************************************
// <!-- Section 3 : App Settings -->
// *****************************************************

app.set('view engine', 'ejs'); // set the view engine to EJS

app.use(bodyParser.json()); // specify the usage of JSON for parsing request body.

// initialize session variables
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        saveUninitialized: false,
        resave: false,
    })
);

app.use(
    bodyParser.urlencoded({
        extended: true,
    })
);

app.use(express.static(path.join(__dirname, 'views', 'static')));

// *****************************************************
// <!-- Section 4 : API Routes -->
// *****************************************************

// Authentication Middleware.
const auth = (req, res, next) => {
    if (!req.session.user) {
        // Default to login page.
        return res.redirect('/login');
    }
    next();
};

app.get('/', (req, res) => {
    res.redirect('/login');
});

app.get('/login', (req, res) => {
    res.render('pages/login', { user: req.session.user });
});

app.get('/register', (req, res) => {
    res.render('pages/register', { user: req.session.user });
});

app.post('/register', async (req, res) => {
    // Hash the password using bcrypt library
    const hash = await bcrypt.hash(req.body.password, 10);

    const query = 'INSERT INTO users (username, password) VALUES ($1, $2)';
    const values = [req.body.username.toLowerCase(), hash]; //makes sure usernames cannot be repeated

    db.none(query, values)
        .then(() => {
            console.log('User registered successfully');
            app.locals.message = 'User registered successfully';
            app.locals.error = '';
            res.redirect('/login');
        })
        .catch((error) => {
            console.error('Error registering user:', error);
            app.locals.message = 'Please select a unique username';
            app.locals.error = 'danger';
            res.redirect('/register');
        });
});



app.post('/login', async (req, res, next) => {
    const { username, password } = req.body; 

    try {
        const user = await db.oneOrNone('SELECT * FROM users WHERE username = $1', [username]);

        if (user) {
            const match = await bcrypt.compare(password, user.password);

            if (match) {
                app.locals.message = '';

                req.session.user = user;
                req.session.save();

                res.redirect('/discover');
            } else {
                app.locals.message = 'Incorrect username or password';
                app.locals.error = 'danger';
                res.redirect('/login');
            }
        } else {
            app.locals.message = 'Please create an account';
            app.locals.error = '';
            res.redirect('/register');
        }
    } catch (error) {
        console.error('Database query error:', error);
        res.status(500).send('Internal Server Error');
    }
});

/* WORKING API CALL SEE DOCS FOR MORE INTO
sdk.auth(process.env.API_KEY); //https://docs.developer.yelp.com/reference/v3_business_search
sdk.v3_business_search({ location: 'Boulder', sort_by: 'best_match', limit: '20' })
    .then(({ data }) => console.log(data))
    .catch(err => console.error(err));
    */

app.get('/search', async (req, res) => {
    let resArr;
    sdk.auth(process.env.API_KEY); //https://docs.developer.yelp.com/reference/v3_business_search
    await sdk.v3_business_search({ location: 'Boulder', term: req._parsedOriginalUrl.query.slice(2), sort_by: 'best_match', limit: '10' })
        .then(results => {
            resArr = results.data.businesses;
            //console.log(resArr);
            res.render('pages/search', { user: req.session.user, locals: resArr});
        })
        .catch(err => console.error(err));
})




app.get('/discover', async (req, res) => {
    res.render('pages/home', { events: [], user: req.session.user });
});

app.post("/posts/add", (req, res) => {
    const { postTitle, postContent } = req.body;

    db.none('INSERT INTO posts(title, content) VALUES($1, $2)', [postTitle, postContent])
        .then(() => {
            res.redirect('/posts');
        })
        .catch((error) => {
            console.error(error);
            res.send('An error occurred');
        });
});


app.get('/posts/new', (req, res) => {
    res.render('pages/new-post', { user: req.session.user });
});

app.post("/posts/delete/:id", (req, res) => {
    const postId = req.params.id;

    db.none('DELETE FROM posts WHERE id = $1', [postId])
        .then(() => {
            res.redirect('/posts');
        })
        .catch((error) => {
            console.error(error);
            res.send('An error occurred');
        });
});

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error logging out:', err);
        } else {
            console.log('User logged out successfully');
        }
        res.render('pages/login', { user: undefined, message: 'Logged out Successfully', error: '' }); //logs out user
    });
});

app.get('/home', (req, res) => {
    res.render('pages/home', { events: [], user: req.session.user });
});

//Welcome Test for Lab 11
app.get('/welcome', (req, res) => {
    res.json({ status: 'success', message: 'Welcome!' });
});


// Authentication Required
app.use(auth);


// *****************************************************
// <!-- Section 5 : Start Server-->
// *****************************************************
// starting the server and keeping the connection open to listen for more requests
module.exports = app.listen(3000);
console.log('Server is listening on port 3000');
