require('./configuration/config');
require('./db/mongoose');

const bodyParser = require('body-parser');
const express = require('express');
const _ = require('lodash');
const {ObjectID} = require('mongodb');

var app = express();
app.use(bodyParser.json());

const port = process.env.PORT;

var {ShoppingList} = require('./models/shoppingList');
var {User} = require('./models/user');
var {authenticate} = require('./middleware/authenticate');

app.post('/shoppingLists', authenticate,  (req, res) => {
    var shoppingList = new ShoppingList({
        list_name: req.body.list_name,
        creator_username: req.user.username,
        _creator: req.user._id
    });

    (async function() {
        try {
            var savedList = await shoppingList.save();
            if(!savedList) return res.status(400).send();
            res.send({savedList});
        } catch(e) {
            res.status(400).send(e);
        }
    })();
});

app.post('/shoppingLists/:listId', authenticate, (req, res) => {
    var listId = req.params.listId;

    if(!ObjectID.isValid(listId)) {
        return res.status(404).send();
    }

    var conditions = {_id: listId, _creator: req.user._id};
    var body = _.pick(req.body, ['item_name', 'price_per_item', 'quantity_requested']);
    var update = {$push: {"list_items": body}};
    var options = {new: true};

    (async function() {
        try {
            var updatedList = await ShoppingList.findOneAndUpdate(conditions, update, options);
            if(!updatedList) return res.status(400).send();
            res.send({updatedList});
        } catch(e) {
            res.status(400).send(e);
        }
    })();
});

app.patch('/shoppingLists/shareList/:listId', authenticate, (req, res) => {
    var listId = req.params.listId;

    if(!ObjectID.isValid(listId)) {
        return res.status(404).send();
    }

    (async function() {
        try {
            var listExists = await User.findOne({email: req.body.sharee_email});
            if(!listExists) return res.status(400).send();

            var conditions = {_id: listId, _creator: req.user._id, sharee_email: null, shared: false};
            var update = {$set: {sharee_email: req.body.sharee_email}};

            var list = await ShoppingList.findOneAndUpdate(conditions, update);
            if(!list) return res.status(400).send();
            res.send();
        } catch(e) {
            res.status(400).send(e);
        }
    })();
});

app.patch('/shoppingLists/unshareList/:listId', authenticate, (req, res) => {
    var listId = req.params.listId;

    if(!ObjectID.isValid(listId)) {
        return res.status(404).send();
    }

    var conditions = {_id: listId, _creator: req.user._id, sharee_email: {$ne: null}, shared: true};
    var update = {$set: {sharee_email: null, shared: false}};

    (async function() {
        try {
            var list = await ShoppingList.findOneAndUpdate(conditions, update);
            if(!list) return res.status(400).send();
            res.send();
        } catch(e) {
            res.status(400).send(e);
        }
    })();
});

app.patch('/shoppingLists/received/unshareList/:listId', authenticate, (req, res) => {
    var listId = req.params.listId;

    if(!ObjectID.isValid(listId)) {
        return res.status(404).send();
    }

    var conditions = {_id: listId, sharee_email: req.user.email, shared: true};
    var update = {$set: {sharee_email: null, shared: false}};

    (async function() {
        try {
            var list = await ShoppingList.findOneAndUpdate(conditions, update);
            if(!list) return res.status(400).send();
            res.send();
        } catch(e) {
            res.status(400).send(e);
        }
    })();
});

app.patch('/shoppingLists/acceptList/:listId', authenticate, (req, res) => {
    var listId = req.params.listId;

    if(!ObjectID.isValid(listId)) {
        return res.status(404).send();
    }

    var conditions = {_id: listId, sharee_email: req.user.email, shared: false};
    var update = {$set: {shared: true}};

    (async function() {
        try {
            var list = await ShoppingList.findOneAndUpdate(conditions, update);
            if(!list) return res.status(400).send();
            res.send();
        } catch(e) {
            res.status(400).send(e);
        }
    })();
});

app.patch('/shoppingLists/rejectList/:listId', authenticate, (req, res) => {
    var listId = req.params.listId;

    if(!ObjectID.isValid(listId)) {
        return res.status(404).send();
    }

    var conditions = {_id: listId, sharee_email: req.user.email, shared: false};
    var update = {$set: {sharee_email: null}};

    (async function() {
        try {
            var list = await ShoppingList.findOneAndUpdate(conditions, update);
            if(!list) return res.status(400).send();
            res.send();
        } catch(e) {
            res.status(400).send(e);
        }
    })();
});

app.patch('/shoppingLists/:listId', authenticate, (req, res) => {
    var listId = req.params.listId;

    if(!ObjectID.isValid(listId)) {
        return res.status(404).send();
    }

    var conditions = {_id: listId, _creator: req.user._id, shared: false};
    var body = {list_name: req.body.list_name};
    var update = {$set: body};
    var options = {new: true};

    (async function() {
        try {
            var updatedList = await ShoppingList.findOneAndUpdate(conditions, update, options);
            if(!updatedList) return res.status(400).send();
            res.send({updatedList});
        } catch(e) {
            res.status(400).send(e);
        }
    })();
});

app.patch('/shoppingLists/:listId/:itemId', authenticate, (req, res) => {
    var listId = req.params.listId;
    var itemId = req.params.itemId;

    if(!ObjectID.isValid(listId) && !ObjectID.isValid(itemId)) {
        return res.status(404).send();
    }

    var conditions = {_id: listId, "list_items._id": itemId, _creator: req.user._id, shared: false};
    var body = _.pick(req.body, ['item_name', 'price_per_item', 'quantity_requested']);
    var update = {$set: {"list_items.$.item_name": body.item_name, "list_items.$.price_per_item": body.price_per_item, "list_items.$.quantity_requested": body.quantity_requested}};
    var options = {new: true};

    (async function() {
        try {
            var updatedList = await ShoppingList.findOneAndUpdate(conditions, update, options);
            if(!updatedList) return res.status(400).send();
            res.send({updatedList});
        } catch(e) {
            res.status(400).send(e);
        }
    })();
});

app.patch('/shoppingLists/received/:listId/:itemId', authenticate, (req, res) => {
    var listId = req.params.listId;
    var itemId = req.params.itemId;

    if(!ObjectID.isValid(listId) && !ObjectID.isValid(itemId)) {
        return res.status(404).send();
    }

    var conditions = {_id: listId, "list_items._id": itemId, sharee_email: req.user.email, shared: true};
    var body = _.pick(req.body, ['price_per_item', 'quantity_available']);
    var update = {$set: {"list_items.$.price_per_item": body.price_per_item, "list_items.$.quantity_available": body.quantity_available}};
    var options = {new: true};

    (async function() {
        try {
            var updatedList = await ShoppingList.findOneAndUpdate(conditions, update, options);
            if(!updatedList) return res.status(400).send();
            res.send({updatedList});
        } catch(e) {
            res.status(400).send(e);
        }
    })();
});

app.get('/shoppingLists', authenticate, (req, res) => {
    var conditions = {_creator: req.user._id};

    (async function() {
        try {
            var myLists = await ShoppingList.find(conditions);
            if(!myLists) return res.status(400).send();
            res.send({myLists});
        } catch(e) {
            res.status(400).send(e);
        }
    })();
});

app.get('/shoppingLists/requests', authenticate, (req, res) => {
    var conditions = {sharee_email: req.user.email, shared: false};

    (async function() {
        try{ 
            var unacceptedLists = await ShoppingList.find(conditions, '-list_items');
            if(!unacceptedLists) res.status(400).send();
            res.send({unacceptedLists});
        } catch(e) {
            res.status(400).send(e);
        }
    })();
});

app.get('/shoppingLists/received', authenticate, (req, res) => {
    var conditions = {sharee_email: req.user.email, shared: true};

    (async function() {
        try {
            var receivedLists = await ShoppingList.find(conditions);
            if(!receivedLists) return res.status(400).send();
            res.send({receivedLists});
        } catch(e) {
            res.status(400).send(e);
        }
    })();
});

app.get('/shoppingLists/shared', authenticate, (req, res) => {
    var conditions = {_creator: req.user._id, sharee_email: {$ne: null}, shared: true};

    (async function() {
        try {
            var sharedLists = await ShoppingList.find(conditions);
            if(!sharedLists) return res.status(400).send();
            res.send({sharedLists});
        } catch(e) {
            res.status(400).send(e);
        }
    })();
});

app.delete('/shoppingLists/:listId', authenticate, (req, res) => {
    var listId = req.params.listId;

    if(!ObjectID.isValid(listId)) {
        return res.status(404).send();
    }

    var conditions = {_id: listId, _creator: req.user._id, shared: false};

    (async function() {
        try {
            var deletedList = await ShoppingList.findOneAndDelete(conditions);
            if(!deletedList) return res.status(400).send();
            res.send({deletedList});
        } catch(e) {
            res.status(400).send(e);
        }
    })();
});

app.delete('/shoppingLists/:listId/:itemId', authenticate, (req, res) => {
    var listId = req.params.listId;
    var itemId = req.params.itemId;

    if(!ObjectID.isValid(listId) && !ObjectID.isValid(itemId)) {
        return res.status(404).send();
    }

    var conditions = {_id: listId, "list_items._id": itemId, _creator: req.user._id, shared: false};
    var update = {$pull: {list_items: {_id: itemId}}};
    var options = {new: true};

    (async function() {
        try {
            var updatedList = await ShoppingList.findOneAndUpdate(conditions, update, options);
            if(!updatedList) return res.status(400).send();
            res.send({updatedList});
        } catch(e) {
            res.status(400).send(e);
        }
    })();
});

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

app.listen(port, () => {
    console.log(`Up on port ${port}`);
});

