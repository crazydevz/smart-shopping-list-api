const _ = require('lodash');
const { ObjectID } = require('mongodb');

const { authenticate } = require('../../middleware/authenticate');
const { app } = require('../../server');
const { Delivery } = require('../../models/delivery');
const { ShoppingList } = require('../../models/shoppingList');
const { User } = require('../../models/user');

// Request a list delivery
app.post('/deliveries', authenticate, (req, res) => {
    const listId = req.body._list;

    if (!ObjectID.isValid(listId)) {
        return res.status(404).send();
    }

    (async function () {
        try {
            // Check if user has another delivery requested already
            let deliveryRequested = await Delivery.findOne({ _sharer: req.user._id });
            if (deliveryRequested) return res.status(400).send();

            let shareeInfo = await User.findOne({ _id: req.body._sharee }).select('username');
            if (!shareeInfo) return res.status(400).send();

            let shoppingList = await ShoppingList.findOneAndUpdate({
                _id: listId, _creator: req.user._id
            },
            {
                $set: {
                    _sharee: req.body._sharee,
                    sharee_username: shareeInfo.username,
                    is_shared_for_delivery: true
                }
            }).select('list_name creator_username');
            if (!shoppingList) return res.status(400).send();

            const { list_name, creator_username } = shoppingList;

            let delivery = new Delivery({
                _list: listId,
                list_name,
                _sharer: req.user._id,
                sharer_username: creator_username,
                _sharee: req.body._sharee,
                sharee_username: shareeInfo.username,
                destination_latitude: req.body.dest_lat,
                destination_longitude: req.body.dest_long
            });

            let savedDeliveryRequest = await delivery.save();
            if (!savedDeliveryRequest) return res.status(400).send();

            savedDeliveryRequest = savedDeliveryRequest.toPrivateJSON();
            res.send({ savedDeliveryRequest });
        } catch (e) {
            res.status(400).send(e);
        }
    })();
});

// Cancel delivery request
app.delete('/deliveries/:deliveryId', authenticate, (req, res) => {
    const deliveryId = req.params.deliveryId;

    if (!ObjectID.isValid(deliveryId)) {
        return res.status(404).send();
    }

    (async () => {
        try {
            const deletedDelivery = await Delivery.findOneAndDelete({ _id: deliveryId, _sharer: req.user._id, _sharee: { $ne: null }, status: 'requested' });
            if (!deletedDelivery) return res.status(400).send();

            res.send({ deletedDelivery });
        } catch (e) {
            res.status(400).send(e);
        }
    })();
});

// Get delivery requests
app.get('/deliveries/requests', authenticate, (req, res) => {
    const userId = req.user._id;

    (async () => {
        try {
            const deliveryRequests = await Delivery.find({ _sharee: userId }).select('-_sharee -sharee_username');
            if (!deliveryRequests) return res.status(400).send();

            res.send({ deliveryRequests });
        } catch (e) {
            res.status(400).send(e);
        }
    })();
});

// Accept delivery request
app.patch('/deliveries/requests/accept/:deliveryId', authenticate, (req, res) => {
    const deliveryId = req.params.deliveryId;

    if (!ObjectID.isValid(deliveryId)) {
        return res.status(404).send();
    }

    (async () => {
        const conditions = { _id: deliveryId, _sharee: req.user._id, status: 'requested' };
        const update = { $set: { status: 'in progress' } }
        try {
            const updatedDelivery = await Delivery.findOneAndUpdate(conditions, update).select('-_sharee -sharee_username');
            res.send({ updatedDelivery });
        } catch (e) {
            res.status(400).send(e);
        }
    })();
});

// Reject delivery request
app.delete('/deliveries/requests/reject/:deliveryId', authenticate, (req, res) => {
    const deliveryId = req.params.deliveryId;

    if (!ObjectID.isValid(deliveryId)) {
        return res.status(404).send();
    }

    (async () => {
        const conditions = { _id: deliveryId, _sharee: req.user._id, status: 'requested' };
        try {
            const deletedDelivery = await Delivery.findOneAndDelete(conditions).select('-_sharee -sharee_username');
            res.send({ deletedDelivery });
        } catch (e) {
            res.status(400).send(e);
        }
    })();
});

// Cancel current delivery (Sharer's action)
app.delete('/deliveries/bySharee/cancel/:deliveryId', authenticate, (req, res) => {
    const deliveryId = req.params.deliveryId;

    if (!ObjectID.isValid(deliveryId)) {
        return res.status(404).send();
    }

    (async () => {
        const conditions = { _id: deliveryId, _sharer: req.user._id, status: 'in progress' };
        try {
            const deletedDelivery = await Delivery.findOneAndDelete(conditions).select('-_sharer -sharer_username');
            res.send({ deletedDelivery });
        } catch (e) {
            res.status(400).send(e);
        }
    })();
});

// Cancel current delivery (Sharee's action)
app.delete('/deliveries/toSharer/cancel/:deliveryId', authenticate, (req, res) => {
    const deliveryId = req.params.deliveryId;

    if (!ObjectID.isValid(deliveryId)) {
        return res.status(404).send();
    }

    (async () => {
        const conditions = { _id: deliveryId, _sharee: req.user._id, status: 'in progress' };
        try {
            const deletedDelivery = await Delivery.findOneAndDelete(conditions).select('-_sharee -sharee_username');
            res.send({ deletedDelivery });
        } catch (e) {
            res.status(400).send(e);
        }
    })();
});

// Indicate delivery completion
app.patch('/deliveries/indicateCompletion/:deliveryId/:listId', (req, res) => {
    const deliveryId = req.params.deliveryId;
    const listId = req.params.listId;

    if (!ObjectID.isValid(deliveryId) && !ObjectID.isValid(listId)) {
        return res.status(404).send();
    }

    (async () => {
        try {
            const shoppingList = await ShoppingList.findOne({ _list: listId }).select('-_sharee -sharee_username');
            if (!shoppingList) return res.status(400).send();

            const conditions = { _id: deliveryId, _list: listId, _sharee: req.user._id, status: 'in progress' };
            const update = { $set: { list_items: shoppingList.list_items, status: 'delivered' } };
            const updatedDelivery = await Delivery.findOneAndUpdate(conditions, update).select('-_sharee -sharee_username');

            res.send({ updatedDelivery });
        } catch (e) {
            res.status(400).send(e);
        }
    })();
});

app.get('/deliveries/requests/:deliveryId/:listId', (req, res) => {
    const deliveryId = req.params.deliveryId;
    const listId = req.params.listId;

    if (!ObjectID.isValid(deliveryId) && !ObjectID.isValid(listId)) {
        return res.status(404).send();
    }

    (async () => {
        try {
            const shoppingList = await ShoppingList.findOne({ _list: listId }).select('list_items');
            if (!shoppingList) return res.status(400).send();

            const listItems = shoppingList.list_items;

            const conditions = { _id: deliveryId, _list: listId, _sharee: req.user._id, status: 'requested' };
            const deliveryFound = await Delivery.findOne(conditions).select('-_sharee -sharee_username');
            if(!deliveryFound) return res.status(400).send();

            res.send({ listItems });
        } catch (e) {
            res.status(400).send(e);
        }
    })();
});