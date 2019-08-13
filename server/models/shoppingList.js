const mongoose = require('mongoose');
const validator = require('validator');

var ShoppingListSchema = mongoose.Schema({
    list_name: {
        type: String,
        required: true,
        minlength: 1,
        trim: true
    },
    sharee_email: {
        default: null,
        type: String,
        minlength: 1,
        trim: true
    },
    list: [{
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
    }]
});

var ShoppingList = mongoose.model('ShoppingList', ShoppingListSchema);

module.exports = {
    ShoppingList
}