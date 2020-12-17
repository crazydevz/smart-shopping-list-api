require('./configuration/config');
require('./db/mongoose');

const bodyParser = require('body-parser');
const express = require('express');

var app = express();
app.use(bodyParser.json());

const port = process.env.PORT;

module.exports = {
    app
};

require('./routes/user/user-actions');
require('./routes/shoppingList/shoppingList');
require('./routes/delivery/delivery');

app.listen(port, () => {
    console.log(`Up on port ${port}`);
});