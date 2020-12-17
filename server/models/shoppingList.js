const mongoose = require('mongoose');
const _ = require('lodash');

var ShoppingListSchema = mongoose.Schema({
    list_name: {
        type: String,
        required: true,
        minlength: 1,
        trim: true
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
    is_shared: {
        type: Boolean,
        default: false
    },
    is_shared_for_delivery: {
        type: Boolean,
        default: false
    },
    _sharee: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    sharee_username:  {
        type: String,
        default: null,
        minlength: 3,
        trim: true
    },
    _creator: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    creator_username:  {
        type: String,
        required: true,
        minlength: 3,
        trim: true
    },
    created_at: {
        type: Number,
        required: true,
    }
});

ShoppingListSchema.methods.toJSON = function(){
    var shoppingList = this;
    var shoppingListObject = shoppingList.toObject();

    return _.pick(shoppingListObject, ['_id', 'list_name', 'list_items', '_sharee', 'sharee_username', '_creator', 'creator_username', 'created_at']);
}

ShoppingListSchema.methods.toPrivateJSON = function() {
    var shoppingList = this;
    var shoppingListObject = shoppingList.toObject();

    return _.pick(shoppingListObject, ['_id', 'list_name', 'list_items', '_sharee', 'sharee_username', 'created_at']);
}

var ShoppingList = mongoose.model('ShoppingList', ShoppingListSchema);

module.exports = {
    ShoppingList
}