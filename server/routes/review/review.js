const _ = require('lodash');
const { ObjectID } = require('mongodb');
const moment = require('moment');

const { app } = require('../../server');
const { authenticate } = require('../../middleware/authenticate');
var { User } = require('../../models/user');
var { Review } = require('../../models/review');

app.post('/reviews/:shareeId', authenticate, (req, res) => {
    let shareeId = req.params.shareeId;

    if (!ObjectID.isValid(shareeId)) {
        return res.status(404).send();
    }

    if(JSON.stringify(shareeId) === JSON.stringify(req.user._id)) return res.status(400).send();

    (async () => {
        try {
            var conditions = { _sharee: shareeId };

            const reviewsExist = await Review.findOne(conditions);
            if (!reviewsExist) {
                const shareeInfo = await User.findOne({ _id: shareeId }).select('username');
                const shareeUsername = shareeInfo.username;

                var review = new Review({
                    _sharee: shareeId,
                    sharee_username: shareeUsername,
                });

                var savedReview = await review.save();
                if (!savedReview) return res.status(400).send();
            }

            var body = {
                _sharer: req.user._id,
                sharer_username: req.user.username,
                review_title: req.body.review_title,
                review_body: req.body.review_body,
                rating: req.body.rating,
                created_at: moment().valueOf()
            };

            var update = { $push: { "reviews": body } };
            var options = { new: true };
            const updatedReviews = await Review.findOneAndUpdate(conditions, update, options);
            if(!updatedReviews) return res.status(400).send();

            res.send({ updatedReviews });
        } catch (e) {
            res.status(400).send(e);
        }
    })();
});

app.get('/reviews/:shareeId', authenticate, (req, res) => {
    let shareeId = req.params.shareeId;

    if (!ObjectID.isValid(shareeId)) {
        return res.status(404).send();
    }

    (async () => {
        var conditions = { _sharee: shareeId };
        const reviews = await Review.findOne(conditions);
        if(!reviews) return res.status(400).send();
        res.send({ reviews });
    })();
});