const { default: mongoose } = require("mongoose");
const product = require("./product");

const cartSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    items: [
        {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product'},
        quantity: Number
        }
    ],
    updatedAt: {
        type: Date,
        default: Date.now
    }
})
module.exports =  mongoose.model('Cart', cartSchema)