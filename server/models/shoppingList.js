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
    shared: {
        type: Boolean,
        default: false
    },
    _creator: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    creator_username:  {
        type: String,
        default: null,
        trim: true
    },
    sharee_email: {
        default: null,
        type: String,
        minlength: 1,
        trim: true
    }
});

ShoppingListSchema.methods.toJSON = function(){
    var shoppingList = this;
    var shoppingListObject = shoppingList.toObject();

    return _.pick(shoppingListObject, ['_id', 'list_name', 'list_items', 'creator_username']);
}

var ShoppingList = mongoose.model('ShoppingList', ShoppingListSchema);

module.exports = {
    ShoppingList
}