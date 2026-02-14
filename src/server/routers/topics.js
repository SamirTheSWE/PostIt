const express = require('express');
const router = express.Router();

const db = require('../../database');


router.get('/topics', async (request, response, next) => {
    try {
        const [topics] = await db.execute('SELECT * FROM topics ORDER BY name ASC');

        response.render('topics', { title: 'All Topics', name: global.name, session: request.session.user, topics });

    } catch (error) {
        next(error);
    }
});



module.exports = router;
