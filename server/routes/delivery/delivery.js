const _ = require('lodash');
const { ObjectID } = require('mongodb');
const moment = require('moment');

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
            let deliveryRequested = await Delivery.findOne({ _sharer: req.user._id, status: 'requested' || 'in progress' });
            if (deliveryRequested) return res.status(400).send();

            let shareeInfo = await User.findOne({ _id: req.body._sharee }).select('username');
            if (!shareeInfo) return res.status(400).send();

            let shoppingList = await ShoppingList.findOneAndUpdate({
                _id: listId,
                _creator: req.user._id,
                _sharee: null,
                is_shared: false,
                is_requested_for_delivery: false,
                is_shared_for_delivery: false
            },
            {
                $set: {
                    _sharee: req.body._sharee,
                    sharee_username: shareeInfo.username,
                    is_requested_for_delivery: true
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

app.get('/deliveries/requests', authenticate, (req, res) => {
    var conditions = { _sharee: req.user._id, is_shared: false, is_requested_for_delivery: true, is_shared_for_delivery: false };

    (async function () {
        try {
            deliveryRequests = await ShoppingList.find(conditions).select('-_sharee -sharee_username');
            if (!deliveryRequests) return res.status(400).send();

            res.send({
                deliveryRequests
            });
        } catch (e) {
            res.status(400).send(e);
        }
    })();
});

app.patch('/deliveries/requests/accept/:listId', authenticate, (req, res) => {
    const listId = req.params.listId;

    if (!ObjectID.isValid(listId)) {
        return res.status(404).send();
    }

    (async () => {
        try {
            let conditions = { _list: listId, _sharee: req.user._id, status: 'requested' };
            let update = { $set: { status: 'in progress', source_latitude: req.body.src_lat, source_longitude: req.body.src_long, started_at: moment().valueOf() } }
            let options = { new: true };

            const updatedDelivery = await Delivery.findOneAndUpdate(conditions, update, options).select('-_sharee -sharee_username');
            if (!updatedDelivery) return res.status(400).send();
            
            conditions = { _id: updatedDelivery._list, _sharee: req.user._id, is_shared: false, is_requested_for_delivery: true, is_shared_for_delivery: false };
            update = { $set: { is_shared_for_delivery: true } };
            options = { new: true }
            
            const listRequestedForDelivery = await ShoppingList.findOneAndUpdate(conditions, update, options);
            if (!listRequestedForDelivery) return res.status(400).send();

            res.send({ updatedDelivery });
        } catch (e) {
            res.status(400).send(e);
        }
    })();
});

app.delete('/deliveries/requests/reject/:listId', authenticate, (req, res) => {
    const listId = req.params.listId;

    if (!ObjectID.isValid(listId)) {
        return res.status(404).send();
    }

    (async () => {
        try {
            let conditions = { _list: listId, _sharee: req.user._id, status: 'requested' };
            const deletedDelivery = await Delivery.findOneAndDelete(conditions).select('-_sharee -sharee_username');
            
            conditions = { _id: deletedDelivery._list, _sharee: req.user._id, is_shared: false, is_requested_for_delivery: true, is_shared_for_delivery: false };
            const update = { $set: { _sharee: null, sharee_username: null, is_requested_for_delivery: false } };
            const options = { new: true }
            
            const listRequestedForDelivery = await ShoppingList.findOneAndUpdate(conditions, update, options);
            if (!listRequestedForDelivery) return res.status(400).send();
            
            res.send({ deletedDelivery });
        } catch (e) {
            res.status(400).send(e);
        }
    })();
});

// ------------------------------------------------------------------------ //

// Cancel delivery request
// app.delete('/deliveries/:deliveryId', authenticate, (req, res) => {
//     const deliveryId = req.params.deliveryId;

//     if (!ObjectID.isValid(deliveryId)) {
//         return res.status(404).send();
//     }

//     (async () => {
//         try {
//             const deletedDelivery = await Delivery.findOneAndDelete({ _id: deliveryId, _sharer: req.user._id, _sharee: { $ne: null }, status: 'requested' });
//             if (!deletedDelivery) return res.status(400).send();

//             const conditions = { _id: deletedDelivery._list, _creator: req.user._id, _sharee: { $ne: null }, is_shared: false, is_requested_for_delivery: true, is_shared_for_delivery: false };
//             const update = { $set: { _sharee: null, sharee_username: null, is_requested_for_delivery: false } };
//             const options = { new: true }

//             const listRequestedForDelivery = await ShoppingList.findOneAndUpdate(conditions, update, options);
//             if (!listRequestedForDelivery) return res.status(400).send();

//             res.send({ deletedDelivery });
//         } catch (e) {
//             res.status(400).send(e);
//         }
//     })();
// });

// Cancel current delivery (Sharer's action)
app.delete('/deliveries/onItsWay/cancel/:listId', authenticate, (req, res) => {
    const listId = req.params.listId;

    if (!ObjectID.isValid(listId)) {
        return res.status(404).send();
    }

    (async () => {
        try {
            let conditions = { _list: listId, _sharer: req.user._id, status: 'in progress' };
            let deletedDelivery = await Delivery.findOneAndDelete(conditions).select('-_sharer -sharer_username');
            
            conditions = { _id: deletedDelivery._list, _creator: req.user._id, _sharee: { $ne: null }, is_shared: false, is_requested_for_delivery: true, is_shared_for_delivery: true };
            const update = { $set: { _sharee: null, sharee_username: null, is_requested_for_delivery: false, is_shared_for_delivery: false } };
            const options = { new: true }

            const listRequestedForDelivery = await ShoppingList.findOneAndUpdate(conditions, update, options);
            if (!listRequestedForDelivery) return res.status(400).send();
            
            res.send({ deletedDelivery });
        } catch (e) {
            res.status(400).send(e);
        }
    })();
});

// Cancel current delivery (Sharee's action)
app.delete('/deliveries/inProgress/cancel/:listId', authenticate, (req, res) => {
    const listId = req.params.listId;

    if (!ObjectID.isValid(listId)) {
        return res.status(404).send();
    }

    (async () => {
        try {
            let conditions = { _list: listId, _sharee: req.user._id, status: 'in progress' };
            const deletedDelivery = await Delivery.findOneAndDelete(conditions).select('-_sharee -sharee_username');

            conditions = { _id: deletedDelivery._list, _sharee: req.user._id, is_shared: false, is_requested_for_delivery: true, is_shared_for_delivery: true };
            const update = { $set: { _sharee: null, sharee_username: null, is_requested_for_delivery: false, is_shared_for_delivery: false } };
            const options = { new: true }

            const listRequestedForDelivery = await ShoppingList.findOneAndUpdate(conditions, update, options);
            if (!listRequestedForDelivery) return res.status(400).send();

            res.send({ deletedDelivery });
        } catch (e) {
            res.status(400).send(e);
        }
    })();
});

// View delivery in progress (Sharee's action)
app.get('/deliveries/inProgress', authenticate, (req, res) => {
    (async () => {
        const conditions = { _sharee: req.user._id, is_shared: false, is_requested_for_delivery: true, is_shared_for_delivery: true };
        try {
            deliveryInProgress = await ShoppingList.findOne(conditions).select('-_sharee -sharee_username');
            if (!deliveryInProgress) return res.status(400).send();

            res.send({
                deliveryInProgress
            });
        } catch(e) {
            res.status(400).send(e);
        }
    })();
});

// View delivery on its way (Sharer's action)
app.get('/deliveries/onItsWay', authenticate, (req, res) => {
    (async () => {
        const conditions = { _creator: req.user._id, is_shared: false, is_requested_for_delivery: true, is_shared_for_delivery: true };
        try {
            deliveryOnItsWay = await ShoppingList.findOne(conditions).select('-_creator -creator_username');
            if (!deliveryOnItsWay) return res.status(400).send();

            res.send({
                deliveryOnItsWay
            });
        } catch(e) {
            res.status(400).send(e);
        }
    })();
});

// Indicate delivery completion (Sharee's action)
app.patch('/deliveries/indicateCompletion/:listId', authenticate, (req, res) => {
    const listId = req.params.listId;

    if (!ObjectID.isValid(listId)) {
        return res.status(404).send();
    }

    (async () => {
        try {
            const updatedList = await ShoppingList.findOneAndUpdate(
                { _id: listId, _sharee: req.user._id, is_shared: false, is_requested_for_delivery: true, is_shared_for_delivery: true },
                { $set: { _sharee: null, sharee_username: null, is_requested_for_delivery: false, is_shared_for_delivery: false } }
            ).select('-_sharee -sharee_username');
            if (!updatedList) return res.status(400).send();

            const conditions = { _list: updatedList._id, _sharee: req.user._id, status: 'in progress' };
            const update = { $set: { list_items: updatedList.list_items, status: 'delivered', finished_at: moment().valueOf() } };
            const options = { new: true };

            const updatedDelivery = await Delivery.findOneAndUpdate(conditions, update, options).select('-_sharee -sharee_username');

            res.send({ updatedDelivery });
        } catch (e) {
            res.status(400).send(e);
        }
    })();
});

// app.get('/deliveries/requests/:deliveryId/:listId', (req, res) => {
//     const deliveryId = req.params.deliveryId;
//     const listId = req.params.listId;

//     if (!ObjectID.isValid(deliveryId) && !ObjectID.isValid(listId)) {
//         return res.status(404).send();
//     }

//     (async () => {
//         try {
//             const shoppingList = await ShoppingList.findOne({ _list: listId, _sharee: req.user._id, is_shared: false, is_requested_for_delivery: true, is_shared_for_delivery: true }).select('list_items');
//             if (!shoppingList) return res.status(400).send();

//             const listItems = shoppingList.list_items;

//             const conditions = { _id: deliveryId, _list: listId, _sharee: req.user._id, status: 'requested' };
//             const deliveryFound = await Delivery.findOne(conditions).select('-_sharee -sharee_username');
//             if (!deliveryFound) return res.status(400).send();

//             res.send({ listItems });
//         } catch (e) {
//             res.status(400).send(e);
//         }
//     })();
// });