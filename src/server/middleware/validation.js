const { body, param, validationResult } = require('express-validator');

const validateRegistration = [
    body('username')
        .trim()
        .isLength({ min: 3, max: 50 })
        .withMessage('Username must be between 3 and 50 characters')
        .matches(/^[a-zA-Z0-9_-]+$/)
        .withMessage('Username can only contain letters, numbers, hyphens and underscores'),

    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters')
        .matches(/[A-Z]/)
        .withMessage('Password must contain at least one uppercase letter')
        .matches(/[0-9]/)
        .withMessage('Password must contain at least one number'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            req.validationErrors = errors.array();
        }
        next();
    }
];

const validatePost = [
    body('title')
        .trim()
        .isLength({ min: 1, max: 255 })
        .withMessage('Title must be between 1 and 255 characters')
        .escape(),

    body('content')
        .trim()
        .isLength({ min: 1, max: 5000 })
        .withMessage('Content must be between 1 and 5000 characters')
        .escape(),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            req.validationErrors = errors.array();
        }
        next();
    }
];

const validateComment = [
    body('content')
        .trim()
        .isLength({ min: 1, max: 1000 })
        .withMessage('Comment must be between 1 and 1000 characters')
        .escape(),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            req.validationErrors = errors.array();
        }
        next();
    }
];

module.exports = {
    validateRegistration,
    validatePost,
    validateComment
};
