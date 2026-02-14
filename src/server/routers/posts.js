const express = require('express');
const router = express.Router();

const db = require('../../database');


router.get('/posts', async (request, response, next) => {
    try {
        const [posts] = await db.execute(
            'SELECT * FROM posts INNER JOIN users ON posts.user_id = users.id ORDER BY posts.created_at DESC'
        );

        response.render('posts', { title: 'All Posts', name: global.name, session: request.session.user, posts });

    } catch (error) {
        next(error);
    }
});


module.exports = router;
