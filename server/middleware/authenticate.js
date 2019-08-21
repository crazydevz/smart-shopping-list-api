const {User} = require('../models/user');

const authenticate = function(req, res, next) {
    var token = req.header('x-auth');

    (async function() {
        try{
            req.user = await User.findByToken(token);
            req.token = token;
            next();
        } catch(e) {
            res.status(401).send();
        }
    })();
}

module.exports = {authenticate}