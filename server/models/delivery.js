const mongoose = require('mongoose');
const _ = require('lodash');

const DeliverySchema = mongoose.Schema({
    _list: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    list_name: {
        type: String,
        trim: true,
        minlength: 1,
        required: true
    },
    list_items: [{
        item_name: {
            type: String,
            required: true,
            minlength: 1,
            trim: true
        },
        price_per_item: {
            type: Number,
            required: true
        },
        quantity_requested: {
            type: Number,
            required: true
        },
        quantity_available: {
            type: Number,
            default: 0
        }
    }],
    _sharer: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    sharer_username: {
        type: String,
        trim: true,
        minlength: 3,
        required: true
    },
    _sharee: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    sharee_username: {
        type: String,
        trim: true,
        minlength: 3,
        default: null
    },
    source_latitude: {
        type: Number,
        default: 0
    },
    source_longitude: {
        type: Number,
        default: 0
    },
    destination_latitude: {
        type: Number,
        required: true
    },
    destination_longitude: {
        type: Number,
        required: true
    },
    started_at: {
        type: Number,
        default: 0
    },
    finished_at: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        trim: true,
        minlength: '9',
        default: 'requested'  // requested || cancelled || in progress || delivered
    }
});

DeliverySchema.methods.toJSON = function(){
    const delivery = this;
    const deliveryObject = delivery.toObject();

    return _.pick(deliveryObject, [
        '_id',
        '_list',
        'list_name',
        '_sharer',
        'sharer_username',
        '_sharee',
        'sharee_username',
        'source_latitude',
        'source_longitude',
        'destination_latitude',
        'destination_longitude',
        'started_at',
        'finished_at',
        'status'
    ]);
};

DeliverySchema.methods.toPrivateJSON = function(){
    const delivery = this;
    const deliveryObject = delivery.toObject();

    return _.pick(deliveryObject, [
        '_id',
        '_list',
        'list_name',
        '_sharee',
        'sharee_username',
        'source_latitude',
        'source_longitude',
        'destination_latitude',
        'destination_longitude',
        'started_at',
        'finished_at',
        'status'
    ]);
};

const Delivery = mongoose.model('Delivery', DeliverySchema);

module.exports = {
    Delivery
};