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

app.post('/shoppingLists/:id', authenticate, (req, res) => {
    var id = req.params.id;

    if(!ObjectID.isValid(id)) {
        return res.status(404).send();
    }

    var body = _.pick(req.body, ['item_name', 'price_per_item', 'quantity_requested']);

    (async function() {
        try {
            var updatedList = await ShoppingList.findOneAndUpdate({_id: id, _creator: req.user._id},{$push: {"list": body}},{new: true});
            if(!updatedList) return res.status(400).send();
            res.send({updatedList});
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

    (async function() {
        try {
            var acceptedList = await ShoppingList.findOneAndUpdate({_id: listId, sharee_email: req.user.email}, {$set: {shared: true}});
            if(!acceptedList) return res.status(400).send();
            res.send();
        } catch(e) {
            res.status(400).send(e);
        }
    })();
});

app.patch('/shoppingLists/:id', authenticate, (req, res) => {
    var id = req.params.id;

    if(!ObjectID.isValid(id)) {
        return res.status(404).send();
    }

    var body = {list_name: req.body.list_name};

    (async function() {
        try {
            var updatedList = await ShoppingList.findOneAndUpdate({_id: id, _creator: req.user._id}, {$set: body}, {new: true});
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

    var body = _.pick(req.body, ['item_name', 'price_per_item', 'quantity_requested', 'quantity_available']);

    (async function() {
        try {
            var updatedList = await ShoppingList.findOneAndUpdate({_id: listId, "list._id": itemId, _creator: req.user._id}, {$set: {"list.$": body}}, {new: true});
            if(!updatedList) return res.status(400).send();
            res.send({updatedList});
        } catch(e) {
            res.status(400).send(e);
        }
    })();
});

app.get('/shoppingLists', authenticate, (req, res) => {
    (async function() {
        try {
            var myLists = await ShoppingList.find({_creator: req.user._id});
            if(!myLists) return res.status(400).send();
            res.send({myLists});
        } catch(e) {
            res.status(400).send(e);
        }
    })();
});

app.get('/shoppingLists/received', authenticate, (req, res) => {
    (async function() {
        try {
            var receivedLists = await ShoppingList.find({sharee_email: req.user.email, shared: true});
            if(!receivedLists) return res.status(400).send();
            res.send({receivedLists});
        } catch(e) {
            res.status(400).send(e);
        }
    })();
});

app.get('/shoppingLists/shared', authenticate, (req, res) => {
    (async function() {
        try {
            var sharedLists = await ShoppingList.find({_creator: req.user._id, sharee_email: {$ne: null}, shared: true});
            if(!sharedLists) return res.status(400).send();
            res.send({sharedLists});
        } catch(e) {
            res.status(400).send(e);
        }
    })();
});

app.delete('/shoppingLists/:id', authenticate, (req, res) => {
    var id = req.params.id;

    if(!ObjectID.isValid(id)) {
        return res.status(404).send();
    }

    (async function() {
        try {
            var deletedList = await ShoppingList.findOneAndDelete({_id: id, _creator: req.user._id});
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

    (async function() {
        try {
            var updatedList = await ShoppingList.findOneAndUpdate({_id: listId, "list._id": itemId, _creator: req.user._id}, {$pull: {list: {_id: itemId}}}, {new: true});
            if(!updatedList) return res.status(400).send();
            res.send({updatedList});
        } catch(e) {
            res.status(400).send(e);
        }
    })();
});

app.post('/users', (req, res) => {
    const body = _.pick(req.body, ['email', 'password']);

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
    const body = _.pick(req.body, ['email', 'password']);

    (async function() {
        try {
            var user = await User.findByCredentials(body.email, body.password);
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

