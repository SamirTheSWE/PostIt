require('dotenv').config();
const ejs = require('ejs');
const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const csrf = require('csurf');

const routes = require('./routes');
const { generalLimiter } = require('./middleware/limiters');


const app = express();
app.set('trust proxy', 1);
const baseURl = '/postit';

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"]
        }
    }
}));

app.use(baseURl, generalLimiter);

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 1000 * 60 * 60 * 24
    }
}));

app.set('view engine', 'ejs');
app.set('views', 'src/assets/views');
app.engine('html', ejs.renderFile);
app.use(baseURl, express.static('src/assets/public'));

app.use(`${baseURl}/css`, express.static('node_modules/bootstrap/dist/css'));
app.use(`${baseURl}/js`, express.static('node_modules/bootstrap/dist/js'));
app.use(`${baseURl}/js`, express.static('node_modules/jquery/dist'));
app.use(`${baseURl}/js`, express.static('node_modules/jquery-ui/dist'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const csrfProtection = csrf({ cookie: false });

app.use(csrfProtection);

app.use((req, res, next) => {
    res.locals.csrfToken = req.csrfToken();
    next();
});

app.use((req, res, next) => {
    res.locals.baseUrl = baseURl;
    next();
});

global.name = "PostIt";
routes.forEach((route) => {
    app.use(baseURl, route);
});

app.use((req, res) => {
    res.status(404).render('error', {
        name: global.name,
        session: req.session.user || null,
        status: 404,
        message: 'Page not found.'
    });
});

app.use((err, req, res, next) => {
    if (err.code === 'EBADCSRFTOKEN') {
        return res.status(403).render('error', {
            name: global.name,
            session: req.session.user || null,
            status: 403,
            message: 'Invalid or expired form submission. Please go back and try again.'
        });
    }
    console.error(err);
    res.status(err.status || 500).render('error', {
        name: global.name,
        session: req.session.user || null,
        status: err.status || 500,
        message: 'Something went wrong. Please try again later.'
    });
});

module.exports = app;
