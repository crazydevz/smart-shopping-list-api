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

app.patch('/shoppingLists/listItem/:id', (req, res) => {
    var id = req.params.id;

    if(!ObjectID.isValid(id)) {
        return res.status(404).send();
    }

    var body = _.pick(req.body, ['item_name', 'price_per_item', 'quantity_requested', 'quantity_available']);

    (async function() {
        try{
            var updatedList = await ShoppingList.findOneAndUpdate({"list._id": id}, {$set: {"list.$": body}}, {new: true});
            if(!updatedList) return res.status(400).send();
            res.send({updatedList});
        } catch(e) {
            res.status(400).send(e);
        }
    })();
});



app.listen(port, () => {
    console.log(`Up on port ${port}`);
});

