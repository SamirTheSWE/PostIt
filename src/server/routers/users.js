const express = require('express');
const router = express.Router();

const db = require('../../database');


router.get('/users', async (request, response, next) => {
    try {
        const [users] = await db.execute('SELECT * FROM users ORDER BY created_at DESC');

        response.render('users', { title: 'All Users', name: global.name, session: request.session.user, users });

    } catch (error) {
        next(error);
    }
});



module.exports = router;
