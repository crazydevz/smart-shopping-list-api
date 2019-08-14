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

app.post('/shoppingLists', (req, res) => {
    var shoppingList = new ShoppingList({
        list_name: req.body.list_name
    });

    (async function() {
        try{
            var savedList = await shoppingList.save();
            if(!savedList) return res.status(400).send();
            res.send({savedList});
        } catch(e) {
            res.status(400).send(e);
        }
    })();
});

app.post('/shoppingLists/:id', (req, res) => {
    var id = req.params.id;

    if(!ObjectID.isValid(id)) {
        return res.status(404).send();
    }

    var body = _.pick(req.body, ['item_name', 'price_per_item', 'quantity_requested']);

    (async function() {
        try{
            var updatedList = await ShoppingList.findOneAndUpdate({_id: id},{$push: {"list": body}},{new: true});
            if(!updatedList) return res.status(404).send();
            res.send({updatedList});
        } catch(e) {
            res.status(400).send(e);
        }
    })();
});

app.patch('/shoppingLists/:id', (req, res) => {
    var id = req.params.id;

    if(!ObjectID.isValid(id)) {
        return res.status(404).send();
    }

    var body = {list_name: req.body.list_name};

    (async function() {
        try{
            var updatedList = await ShoppingList.findOneAndUpdate({_id: id}, {$set: body}, {new: true});
            if(!updatedList) return res.status(400).send();
            res.send({updatedList});
        } catch(e) {
            res.status(400).send(e);
        }
    })();
});

app.patch('/shoppingLists/:listId/:itemId', (req, res) => {
    var listId = req.params.listId;
    var itemId = req.params.itemId;

    if(!ObjectID.isValid(listId) && !ObjectID.isValid(itemId)) {
        return res.status(404).send();
    }

    var body = _.pick(req.body, ['item_name', 'price_per_item', 'quantity_requested', 'quantity_available']);

    (async function() {
        try{
            var updatedList = await ShoppingList.findOneAndUpdate({_id: listId, "list._id": itemId}, {$set: {"list.$": body}}, {new: true});
            if(!updatedList) return res.status(400).send();
            res.send({updatedList});
        } catch(e) {
            res.status(400).send(e);
        }
    })();
});

app.delete('/shoppingLists/:id', (req, res) => {
    var id = req.params.id;

    if(!ObjectID.isValid(id)) {
        return res.status(404).send();
    }

    (async function() {
        try{
            var deletedList = await ShoppingList.findByIdAndDelete(id);
            if(!deletedList) return res.status(400).send();
            return res.send({deletedList});
        } catch(e) {
            res.status(400).send(e);
        }
    })();
});

app.delete('/shoppingLists/:listId/:itemId', (req, res) => {
    var listId = req.params.listId;
    var itemId = req.params.itemId;

    if(!ObjectID.isValid(listId) && !ObjectID.isValid(itemId)) {
        return res.status(404).send();
    }

    (async function() {
        try{
            var deletedList = await ShoppingList.findOneAndUpdate({_id: listId}, {$pull: {"list": {_id: itemId}}}, {new: true});
            if(!deletedList) return res.status(400).send();
            return res.send({deletedList});
        } catch(e) {
            res.status(400).send(e);
        }
    })();
});

app.listen(port, () => {
    console.log(`Up on port ${port}`);
});

