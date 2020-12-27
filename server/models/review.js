const mongoose = require('mongoose');
const _ = require('lodash');

var ReviewSchema = mongoose.Schema({
    _sharee: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    sharee_username: {
        type: String,
        default: null,
        minlength: 3,
        trim: true
    },
    reviews: [{
        _sharer: {
            type: mongoose.Schema.Types.ObjectId,
            default: null
        },
        sharer_username: {
            type: String,
            default: null,
            minlength: 3,
            trim: true
        },
        review_title: {
            type: String,
            default: null,
            minlength: 4,
            trim: true
        },
        review_body: {
            type: String,
            default: null,
            minlength: 4,
            trim: true
        },
        rating: {
            type: Number,
            default: 1
        },
        created_at: {
            type: Number,
            required: true,
        }
    }],
    number_of_reviews: {
        type: Number,
        default: 0
    },
    rating_sum: {
        type: Number,
        default: 0
    },
    average_rating: {
        type: Number,
        default: 5
    }
});

ReviewSchema.methods.toJSON = function(){
    var shoppingList = this;
    var shoppingListObject = shoppingList.toObject();

    return shoppingListObject;
    // return _.pick(shoppingListObject, ['_id', 'list_name', 'list_items', '_sharee', 'sharee_username', '_creator', 'creator_username', 'created_at']);
}

var Review = mongoose.model('Review', ReviewSchema);

module.exports = {
    Review
};