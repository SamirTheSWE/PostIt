const bcrypt = require('bcrypt');
const express = require('express');
const router = express.Router();

const db = require('../../database');
const { authLimiter } = require('../middleware/limiters');
const { validateRegistration } = require('../middleware');

const isValidRedirect = (redirect) => {
    if (!redirect) return true;
    return redirect.startsWith('/') && !redirect.startsWith('//');
};


const hashPassword = async (password) => {
    const saltRounds = 10; 
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
};


router.get('/register', (request, response) => {
    let route = request.baseUrl + '/register';
    let message = null;
    const redirect = request.query.redirect || null;

    if (redirect && !isValidRedirect(redirect)) {
        return response.status(400).send('Invalid redirect parameter');
    }

    if (redirect) {
        route += `?redirect=${redirect}`;
        message = {
            type: 'info',
            text: 'You Must be Logged-In to View that Page!'
        };
    };

    if (request.session.user) {
        return response.redirect(request.baseUrl);
    };

    response.render('authentication', {
        title: 'Register',
        name: global.name,
        session: null,
        type: 'Register',
        route: route,
        message: message
    });
});

router.post('/register', authLimiter, validateRegistration, async (request, response, next) => {
    const redirect = request.query.redirect || null;

    if (redirect && !isValidRedirect(redirect)) {
        return response.status(400).send('Invalid redirect parameter');
    }

    if (request.session.user) {
        return response.redirect(request.baseUrl);
    };

    if (request.validationErrors) {
        return response.render('authentication', {
            title: 'Register',
            name: global.name,
            session: null,
            type: 'Register',
            route: request.baseUrl + '/register',
            message: {
                type: 'danger',
                text: request.validationErrors.map(e => e.msg).join('. ')
            }
        });
    }

    const { username, password } = request.body;
    const hashedPassword = await hashPassword(password);

    try {
        const [check] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
        if (check && check.length > 0) {
            return response.render(
                'authentication', {
                    title: 'Register',
                    name: global.name,
                    session: null,
                    type: 'Register',
                    route:  request.baseUrl + '/register',
                    message: {
                        type: 'warning',
                        text: 'Username Already Exists!'
                    }
                }
            );
        }

        await db.execute('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]);
        const [userResult] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
        const user = userResult[0];

        request.session.user = {
            id: user.id,
            username: user.username
        };

        const redirectUrl = redirect || request.baseUrl;
        request.session.save((err) => {
            if (err) return next(err);
            response.redirect(redirectUrl);
        });

    } catch (error) {
        next(error);
    }
});


router.get('/login', (request, response) => {
    let route = request.baseUrl + '/login';
    let message = null;
    const redirect = request.query.redirect || null;

    if (redirect && !isValidRedirect(redirect)) {
        return response.status(400).send('Invalid redirect parameter');
    }

    if (redirect) {
        route += `?redirect=${redirect}`;
        message = {
            type: 'info',
            text: 'You Must be Logged-In to View that Page!'
        };
    };

    if (request.session.user) {
        return response.redirect(request.baseUrl);
    };

    response.render('authentication', {
        title: 'Login',
        name: global.name,
        session: null,
        type: 'Login',
        route: route,
        message: message
    });
});

router.post('/login', authLimiter, async (request, response, next) => {
    const redirect = request.query.redirect || null;

    if (redirect && !isValidRedirect(redirect)) {
        return response.status(400).send('Invalid redirect parameter');
    }

    if (request.session.user) {
        return response.redirect(request.baseUrl);
    };

    const { username, password } = request.body;

    try {
        const [data] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);

        if (!data || data.length === 0) {
            return response.render('authentication', {
                title: 'Login',
                name: global.name,
                session: null,
                type: 'Login',
                route: request.baseUrl + '/login',
                message: {
                    type: 'danger',
                    text: 'Invalid credentials'
                }
            });
        }
        const user = data[0];

        const match = await bcrypt.compare(password, user.password);
        if (match) {
            request.session.user = {
                id: user.id,
                username: user.username
            };
            const redirectUrl = redirect || request.baseUrl;
            return request.session.save((err) => {
                if (err) return next(err);
                response.redirect(redirectUrl);
            });
        } else {
            return response.render('authentication', {
                title: 'Login',
                name: global.name,
                session: null,
                type: 'Login',
                route: request.baseUrl + '/login',
                message: {
                    type: 'danger',
                    text: 'Invalid credentials'
                }
            });
        }
    } catch (error) {
        next(error);
    }
});


router.get('/logout', (request, response) => {
    if (request.session.user) {
        request.session.destroy();
    };

    response.redirect(request.baseUrl);
});


module.exports = router;
