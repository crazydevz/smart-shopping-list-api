const moment = require('moment');

var { app, _, ObjectID, authenticate } = require('../../server');
var {ShoppingList} = require('../../models/shoppingList');
var {User} = require('../../models/user');

app.post('/shoppingLists', authenticate,  (req, res) => {
    var shoppingList = new ShoppingList({
        list_name: req.body.list_name,
        creator_username: req.user.username,
        _creator: req.user._id,
        createdAt: moment().valueOf()
    });

    (async function() {
        try {
            var savedList = await shoppingList.save();
            if(!savedList) return res.status(400).send();
            savedList = savedList.toPrivateJSON();
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
            var updatedList = await ShoppingList.findOneAndUpdate(conditions, update, options).select('-_creator -creator_username');
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
            if(req.user.email === req.body.username) {
                 return res.status(400).send();
            }

            var sharee = await User.findOne({username: req.body.username}).select('_id username');
            if(!sharee) return res.status(400).send();

            var conditions = {_id: listId, _creator: req.user._id, shared: false};
            var update = {$set: {_sharee: sharee._id, sharee_username: sharee.username}};
            var options = {new: true};

            var sharedList = await ShoppingList.findOneAndUpdate(conditions, update, options).select('-_creator -creator_username');
            if(!sharedList) return res.status(400).send();
            res.send({sharedList});
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

    var conditions = {_id: listId, _creator: req.user._id, _sharee: {$ne: null}, shared: true};
    var update = {$set: {_sharee: null, sharee_username: null, shared: false}};

    (async function() {
        try {
            var unsharedList = await ShoppingList.findOneAndUpdate(conditions, update).select('-_creator -creator_username');
            if(!unsharedList) return res.status(400).send();
            res.send({unsharedList});
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

    var conditions = {_id: listId, _sharee: req.user._id, shared: true};
    var update = {$set: {_sharee: null, sharee_username: null, shared: false}};
    var options = {new: true};

    (async function() {
        try {
            var unsharedList = await ShoppingList.findOneAndUpdate(conditions, update, options).select('-_sharee -sharee_username');
            if(!unsharedList) return res.status(400).send();
            res.send({unsharedList});
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

    var conditions = {_id: listId, _sharee: req.user._id, shared: false};
    var update = {$set: {shared: true}};
    var options = {new: true};

    (async function() {
        try {
            var acceptedList = await ShoppingList.findOneAndUpdate(conditions, update, options).select('-_sharee -sharee_username');
            if(!acceptedList) return res.status(400).send();
            res.send({acceptedList});
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

    var conditions = {_id: listId, _sharee: req.user._id, shared: false};
    var update = {$set: {_sharee: null, sharee_username: null}};
    var options = {new: true};

    (async function() {
        try {
            var rejectedList = await ShoppingList.findOneAndUpdate(conditions, update, options).select('-_sharee -sharee_username');
            if(!rejectedList) return res.status(400).send();
            res.send({rejectedList});
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
            var updatedList = await ShoppingList.findOneAndUpdate(conditions, update, options).select('-creator_username -_creator');
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
            var updatedList = await ShoppingList.findOneAndUpdate(conditions, update, options).select('-creator_username -_creator');
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

    var conditions = {_id: listId, "list_items._id": itemId, _sharee: req.user._id, shared: true};
    var body = _.pick(req.body, ['price_per_item', 'quantity_available']);
    var update = {$set: {"list_items.$.price_per_item": body.price_per_item, "list_items.$.quantity_available": body.quantity_available}};
    var options = {new: true};

    (async function() {
        try {
            var updatedList = await ShoppingList.findOneAndUpdate(conditions, update, options).select('-_sharee -sharee_username');
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
            var myLists = await ShoppingList.find(conditions).select('-creator_username -_creator');
            if(!myLists) return res.status(400).send();
            res.send({myLists});
        } catch(e) {
            res.status(400).send(e);
        }
    })();
});

app.get('/shoppingLists/requests', authenticate, (req, res) => {
    var conditions = {_sharee: req.user._id, shared: false};

    (async function() {
        try{ 
            var unacceptedLists = await ShoppingList.find(conditions).select('-_sharee -sharee_username');
            if(!unacceptedLists) res.status(400).send();
            res.send({unacceptedLists});
        } catch(e) {
            res.status(400).send(e);
        }
    })();
});

app.get('/shoppingLists/received', authenticate, (req, res) => {
    var conditions = {_sharee: req.user._id, shared: true};

    (async function() {
        try {
            var receivedLists = await ShoppingList.find(conditions).select('-_sharee -sharee_username');
            if(!receivedLists) return res.status(400).send();
            res.send({receivedLists});
        } catch(e) {
            res.status(400).send(e);
        }
    })();
});

app.get('/shoppingLists/shared', authenticate, (req, res) => {
    var conditions = {_creator: req.user._id, _sharee: {$ne: null}, shared: true};

    (async function() {
        try {
            var sharedLists = await ShoppingList.find(conditions).select('-creator_username -_creator');
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
            var deletedList = await ShoppingList.findOneAndDelete(conditions).select('-_creator -creator_username');
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
            var updatedList = await ShoppingList.findOneAndUpdate(conditions, update, options).select('-_creator -creator_username');
            if(!updatedList) return res.status(400).send();
            res.send({updatedList});
        } catch(e) {
            res.status(400).send(e);
        }
    })();
});