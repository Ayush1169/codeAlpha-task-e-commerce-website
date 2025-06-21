var express = require('express');
var router = express.Router();
const User = require('./users')
const Product = require('./product')
const upload =require('./multer')
const Order = require('./order')
const passport = require('passport');

/* GET home page. */
router.get('/', async (req, res) => {
  try {
    const categories = ['Electronics', 'Groceries', 'Clothing', 'Books']
    const categorizedProducts = {}

    for (const category of categories) {
      categorizedProducts[category] = await Product.find({ category })
    }

   res.render('index', {
  categorizedProducts,
  currentUser: req.user,
  messages: req.flash() 
});


  } catch (err) {
    res.status(500).send("Error loading products")
  }
})



router.get('/login', (req, res, next) => {
  res.render("login", {error: req.flash("error")})
})

router.get('/register', (req, res, next) => {
  res.render("register", {error: req.flash("error")})
})

router.post('/register', async (req, res,) => {
  const { name, username, email, password, role } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).send("Email already registered.");
  }

  const userData = new User({ name, username, email, role });

  User.register(userData, password, function(err, user) {
    if (err) {
      console.error("Registration error:", err);
      return res.status(400).send("registration failed: " + err.message);
    }
    req.login(user, function(err) {
      if (err) {
        console.error("login error after registration:", err);
        return next(err);
      }
      return res.redirect('/login');
    });
  });
});
router.post('/login', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
}));
router.get('/logout', (req, res) => {
  req.logOut(function(err) {
    if(err) {return next(err)}
    res.redirect('/')
  })
})

router.get('/product/:id', async (req, res) => {
  try{
    const product = await Product.findById(req.params.id)
    if(!product) return res.status(404).send('product not found')
      res.render('product', {product})
  } catch(err) {
    console.error("Product fetch error", err)
    res.status(500).send("Error loading product")
  }
})

router.get('/new', (req, res) => {
  if(!req.isAuthenticated() || req.user.role !== 'admin') {
    return res.status(403).send("Access denied")
  }
  res.render('newProduct', {currentUser: req.user})
})

router.post('/new', upload.single('image'), async (req, res) => {
  if(!req.isAuthenticated() || req.user.role !== 'admin') {
    return res.status(403).send("Access denied")
  }

  console.log("creating product for user:", req.user._id)

  const {title, description, price, category, stock} = req.body
  const image = req.file.filename || 'default.jpg'

  const newProduct = new Product({
   name: title,
   title,
   description,
   category,
   stock,
   price, 
   image, 
   uploadedBy: req.user._id
      })
  await newProduct.save()
  res.redirect('/')
})

const methodOverride = require('method-override');
const product = require('./product');
const { default: mongoose } = require('mongoose');
router.use(methodOverride('_method'));

router.delete('/product/:id', async (req, res) => {
  try {
    if (req.user && req.user.role === 'admin') {
      await Product.findByIdAndDelete(req.params.id);
      res.redirect('/');
    } else {
      res.status(403).send("Not allowed");
    }
  } catch (err) {
    res.status(500).send("Delete failed");
  }
});

router.get('/category/:categoryName', async (req, res) => {
  const categoryName = req.params.categoryName;
  console.log("Requested category:", categoryName);
  try {
    const products = await Product.find({ category: categoryName });
    console.log("Found products:", products);
    res.render('category', { category: categoryName, products, currentUser: req.user });
  } catch (err) {
    console.error("Category page error:", err);
    res.status(500).send("Category load failed");
  }
});

router.post('/add-to-cart/:id', async (req, res) => {
  const productId = req.params.id;

  if (!req.isAuthenticated()) {
    return res.redirect('/login');
  }

  if (!req.session.cart) {
    req.session.cart = {};
  }

  if (!req.session.cart[productId]) {
    req.session.cart[productId] = 1;
  } else {
    req.session.cart[productId]++;
  }

  req.flash('success', 'Added to cart successfully!');
  res.redirect('/');
});

router.get('/profile', async (req, res) => {
  if (!req.isAuthenticated()) return res.redirect('/login');

  if (req.user.role === 'admin') {
    // ✅ Only fetch products posted by this admin
    const myProducts = await Product.find({ uploadedBy: req.user._id });

    // ✅ Populate orders and nested uploadedBy
    const allOrders = await Order.find().populate({
      path: 'items.product',
      populate: {
        path: 'uploadedBy',
        model: 'User'
      }
    });

    const productOrderCounts = {};
    const relevantOrders = [];

    allOrders.forEach(order => {
      let hasMyProduct = false;

      order.items.forEach(item => {
        if (
          item.product &&
          item.product.uploadedBy &&
          item.product.uploadedBy._id &&
          item.product.uploadedBy._id.toString() === req.user._id.toString()
        ) {
          hasMyProduct = true;

          const id = item.product._id;
          if (!productOrderCounts[id]) productOrderCounts[id] = 0;
          productOrderCounts[id] += item.quantity;
        }
      });

      if (hasMyProduct) relevantOrders.push(order);
    });

    res.render('profile_admin', {
      currentUser: req.user,
      myProducts,
      productOrderCounts,
      allOrders: relevantOrders // ✅ You can use this if you want admin to see/manage orders
    });

  } else {
    // ✅ For normal users
    const myOrders = await Order.find({ user: req.user._id }).populate('items.product');
    res.render('profile_user', {
      currentUser: req.user,
      cart: req.session.cart || {},
      orders: myOrders
    });
  }
});


router.get('/checkout/:id', async (req, res) => {
  if (!req.isAuthenticated()) return res.redirect('/login')

    const product = await Product.findById(req.params.id)
    if (!product) return res.status(404).send("Product not found")

      res.render('checkout', { 
        product,
        currentUser: req.user,
        adminUpi: "admin@upi"
       })
})

router.post('/place-order/:id', async (req, res) => {
  if (!req.isAuthenticated()) return res.redirect('/login')

    const product = await Product.findById(req.params.id)
    if (!product) return res.status(404).send("product not found")

      const { lat, lng, address, paymentMethod } = req.body

      const order = new Order({
        user: req.user._id,
        items: [{ product: product._id, quantity: 1}], 
        totalAmount: product.price,
        paymentStatus: paymentMethod === 'online' ? 'paid' : 'cash-on-delivery',
        shippingAddress: address,
        location: { lat, lng },
        paymentMethod
      })
      await order.save()

      req.flash('seccess', 'Order placed seccessfully')
      res.redirect('/profile')
})

router.post('/update-status/:id', async (req, res) => {
  const { status } = req.body;
  await Order.updateMany({ 'items.product': req.params.id }, { orderStatus: status });
  req.flash('success', 'Order status updated');
  res.redirect('/profile');
});

router.get('/admin/orders', async (req, res) => {
  if (!req.isAuthenticated() || req.user.role !== 'admin') {
    return res.status(403).send("Access denied");
  }

  const orders = await Order.find().populate('user items.product');
  res.render('admin_orders', { orders });
});

router.post('/admin/order/:id/status', async (req, res) => {
  const { newStatus } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).send("Order not found");

  if (newStatus === 'accepted') {
    order.orderStatus = 'accepted';

    // Optional: Estimate delivery (mock logic)
    const lat = parseFloat(order.location.lat || 0);
    const days = lat > 25 ? 3 : 5; // Just example logic
    order.deliveryEstimate = `${days} Days`;
  } else if (newStatus === 'rejected') {
    order.orderStatus = 'rejected';
  }

  await order.save();
  res.redirect('/profile');
});

router.post('/cancel-order/:id', async (req, res) => {
  if (!req.isAuthenticated()) return res.redirect('/login');
  
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) return res.status(404).send("Order not found");

  // Optional: Only allow cancel if not already shipped/delivered
  if (['processing', 'accepted'].includes(order.orderStatus)) {
    await Order.deleteOne({ _id: order._id });
    req.flash('success', 'Order cancelled successfully.');
  } else {
    req.flash('error', 'You cannot cancel a shipped/delivered order.');
  }

  res.redirect('/profile');
});


module.exports = router;
