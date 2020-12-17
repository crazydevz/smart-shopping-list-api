const _ = require('lodash');

const { authenticate } = require('../../middleware/authenticate');
var { app } = require('../../server');
var { User } = require('../../models/user');

app.post('/users', (req, res) => {
    const body = _.pick(req.body, ['email', 'username', 'password']);

    var user = new User(body);

    (async function() {
        try {
            var token = await user.generateAuthToken();
            res.header('x-auth', token).send(user);
        } catch(e) {
            res.status(400).send();
        }
    })();
});

app.post('/users/login', (req, res) => {
    const body = _.pick(req.body, ['emailOrUsername', 'password']);

    (async function() {
        try {
            var user = await User.findByCredentials(body.emailOrUsername, body.password);
            var token = await user.generateAuthToken();

            res.header('x-auth', token).send(user);
        } catch(e) {
            res.status(400).send(e);
        }
    })();
});

app.get('/users/me', authenticate, (req, res) => {
    res.send(req.user);
});

app.delete('/users/me/token', authenticate, (req, res) => {
    (async function() {
        try {
            await req.user.removeToken(req.token);
            res.send();
        } catch(e) {
            res.status(400).send();
        }
    })();
});