var { app, authenticate } = require('../../server');

app.get('/users', (req, res) => {
    (async function () {
        try {
            const users = await User.find({});
            if (users)
                res.send({ users });
            else
                res.status(404).send();
        } catch (e) {
            res.status(400).send();
        }
    })();
});