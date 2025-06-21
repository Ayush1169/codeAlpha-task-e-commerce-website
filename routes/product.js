const { default: mongoose } = require("mongoose");
const upload = require("./multer");

const productSchema = new mongoose.Schema({
    name: String,
    description: String,
    price: Number,
    category: String,
    image: String,
    stock: Number,
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: { type: Date, default: Date.now }
})
module.exports = mongoose.model('Product', productSchema)