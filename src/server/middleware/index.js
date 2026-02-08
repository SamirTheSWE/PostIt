const checkArgs = require('./common/checkArgs');
const { validateRegistration, validatePost, validateComment } = require('./validation');

module.exports = {
    checkArgs,
    validateRegistration,
    validatePost,
    validateComment
};
