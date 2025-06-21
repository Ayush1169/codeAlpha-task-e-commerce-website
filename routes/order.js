const { default: mongoose } = require("mongoose");
const product = require("./product");

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    items: [
        {
            product: { type: mongoose.Schema.Types.ObjectId,
                ref: product
            },
            quantity: Number
        }
    ],
    totalAmount: Number,
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'cash-on-delivery'],
        default: 'pending'
    },
    orderStatus: {
        type: String,
        enum: ['processing', 'shipped', 'delivered', 'rejected', 'accepted'],
        default: 'processing'
    },
    shippingAddress: String,

    location: {
        lat: Number,
        lng: Number
    },

    orderedAt: {
        type: Date,
        default: Date.now
    }
})
module.exports = mongoose.model('Order', orderSchema)