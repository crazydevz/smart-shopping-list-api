require('./configuration/config');
require('./db/mongoose');

const bodyParser = require('body-parser');
const express = require('express');

var app = express();
app.use(bodyParser.json());

const port = process.env.PORT;

const _ = require('lodash');
const { ObjectID } = require('mongodb');
const { authenticate } = require('./middleware/authenticate');

module.exports = {
    app,
    _,
    ObjectID,
    authenticate
};

require('./routes/user/user-actions');
require('./routes/shoppingList/shoppingList');

app.listen(port, () => {
    console.log(`Up on port ${port}`);
});