const express = require('express');
const router = express.Router();

const db = require('../../database');
const { checkArgs, validateComment } = require('../middleware');


router.post('/topics/:topicArg/posts/:postId/comments', checkArgs, validateComment, async (request, response, next) => {
    const topicArg = request.params.topicArg;
    const postId = request.params.postId;

    try {
        const [topic] = await db.execute('SELECT * FROM topics WHERE name = ?', [topicArg]);
        if (!topic || topic.length === 0) {
            response.sendStatus(404);
            return;
        };

        const [post] = await db.execute('SELECT * FROM posts WHERE id = ?', [postId]);
        if (!post || post.length === 0) {
            response.sendStatus(404);
            return;
        };

        if (!request.session.user) {
            response.status(401);
            response.redirect(`${request.baseUrl}/login?redirect=/topics/${topic[0].name}/posts/${post[0].id}`);
            return;
        };

        const [check] = await db.execute('SELECT * FROM user_topic WHERE user_id = ? AND topic_id = ?', [request.session.user.id, topic[0].id]);
        if (!check || check.length === 0) {
            response.redirect(`${request.baseUrl}/topics/${topic[0].name}/posts/${post[0].id}`);
            return;
        };

        if (request.validationErrors) {
            response.redirect(`${request.baseUrl}/topics/${topic[0].name}/posts/${post[0].id}`);
            return;
        }

        const { content } = request.body;

        await db.execute('INSERT INTO comments (content, user_id, post_id) VALUES (?, ?, ?)', [content, request.session.user.id, post[0].id]);

        response.redirect(`${request.baseUrl}/topics/${topic[0].name}/posts/${post[0].id}`);
    }
    catch (error) {
        next(error);
    }
});

router.get('/topics/:topicArg/posts/:postId/comments/:commentId/reply', checkArgs, async (request, response, next) => {
    const topicArg = request.params.topicArg;
    const postId = request.params.postId;
    const commentId = request.params.commentId;

    try {
        const [topic] = await db.execute('SELECT * FROM topics WHERE name = ?', [topicArg]);
        if (!topic || topic.length === 0) {
            response.sendStatus(404);
            return;
        };

        const [post] = await db.execute('SELECT * FROM posts WHERE id = ?', [postId]);
        if (!post || post.length === 0) {
            response.sendStatus(404);
            return;
        };

        const [comment] = await db.execute('SELECT * FROM comments WHERE id = ?', [commentId]);
        if (!comment || comment.length === 0) {
            response.sendStatus(404);
            return;
        };

        if (!request.session.user) {
            response.status(401);
            response.redirect(`${request.baseUrl}/login?redirect=/topics/${topic[0].name}/posts/${post[0].id}`);
            return;
        };

        const [check] = await db.execute('SELECT * FROM user_topic WHERE user_id = ? AND topic_id = ?', [request.session.user.id, topic[0].id]);
        if (!check || check.length === 0) {
            response.render('new-reply', {
                title: 'New Reply',
                name: global.name,
                session: request.session.user,
                topic: topic[0],
                post: post[0],
                comment: comment[0],
                message: {
                    type: 'warning',
                    text: 'You are Not a Member of this Topic. Redirecting to Topic Page . . .',
                    redirect: `${request.baseUrl}/topics/${topic[0].name}`
                }
            });
            return;
        };

        response.render('new-reply', {
            title: 'New Reply',
            name: global.name,
            session: request.session.user,
            topic: topic[0],
            post: post[0],
            comment: comment[0]
        });
    }
    catch (error) {
        next(error);
    }
});

router.post('/topics/:topicArg/posts/:postId/comments/:commentId/reply', checkArgs, validateComment, async (request, response, next) => {
    const topicArg = request.params.topicArg;
    const postId = request.params.postId;
    const commentId = request.params.commentId;

    try {
        const [topic] = await db.execute('SELECT * FROM topics WHERE name = ?', [topicArg]);
        if (!topic || topic.length === 0) {
            response.sendStatus(404);
            return;
        };

        const [post] = await db.execute('SELECT * FROM posts WHERE id = ?', [postId]);
        if (!post || post.length === 0) {
            response.sendStatus(404);
            return;
        };

        if (!request.session.user) {
            response.status(401);
            response.redirect(`${request.baseUrl}/login?redirect=/topics/${topic[0].name}/posts/${post[0].id}`);
            return;
        };

        const [check] = await db.execute('SELECT * FROM user_topic WHERE user_id = ? AND topic_id = ?', [request.session.user.id, topic[0].id]);
        if (!check || check.length === 0) {
            response.redirect(`${request.baseUrl}/topics/${topic[0].name}/posts/${post[0].id}`);
            return;
        };

        if (request.validationErrors) {
            response.redirect(`${request.baseUrl}/topics/${topic[0].name}/posts/${post[0].id}`);
            return;
        }

        const { content } = request.body;

        await db.execute('INSERT INTO comments (content, user_id, post_id, parent_id) VALUES (?, ?, ?, ?)', [content, request.session.user.id, post[0].id, commentId]);

        response.redirect(`${request.baseUrl}/topics/${topic[0].name}/posts/${post[0].id}`);
    }
    catch (error) {
        next(error);
    }
});


router.post('/topics/:topicArg/posts/:postId/comments/delete', checkArgs, async (request, response, next) => {
    const topicArg = request.params.topicArg;
    const postId = request.params.postId;

    try {
        const [topic] = await db.execute('SELECT * FROM topics WHERE name = ?', [topicArg]);
        if (!topic || topic.length === 0) {
            response.sendStatus(404);
            return;
        };

        const [post] = await db.execute('SELECT * FROM posts WHERE id = ?', [postId]);
        if (!post || post.length === 0) {
            response.sendStatus(404);
            return;
        };

        if (!request.session.user) {
            response.status(401);
            response.redirect(`${request.baseUrl}/login?redirect=/topics/${topic[0].name}/posts/${post[0].id}`);
            return;
        };

        const { commentId } = request.body;
        if (!commentId) {
            response.redirect(`${request.baseUrl}/topics/${topic[0].name}/posts/${post[0].id}`);
            return;
        };

        const [comment] = await db.execute('SELECT * FROM comments WHERE id = ? AND user_id = ?', [commentId, request.session.user.id]);
        if (!comment || comment.length === 0) {
            response.redirect(`${request.baseUrl}/topics/${topic[0].name}/posts/${post[0].id}`);
            return;
        };

        await db.execute('DELETE FROM comments WHERE id = ? OR parent_id = ?', [comment[0].id, comment[0].id]);
        
        response.redirect(`${request.baseUrl}/topics/${topic[0].name}/posts/${post[0].id}`);
    }
    catch (error) {
        next(error);
    }
});


module.exports = router;
