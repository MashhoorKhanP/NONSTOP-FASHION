const mongoose = require('mongoose');
const categoriesSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    image: {
        type: String,
        //required:true
    },
    isListed: {
        type: Boolean,
        default: true
    },
    offer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Offer'
    }
});
module.exports = mongoose.model('Categories', categoriesSchema);