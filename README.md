# codeAlpha-task-e-commerce-website
# 🛒 E-Commerce Website (Node.js + Express + MongoDB)

A simple e-commerce platform where users can browse, buy, and track products. Admins can manage inventory and track orders.

---

## 👨‍💻 Features

### For Users:
- Register and login with role selection (User/Admin)
- View products by category
- Add to cart or buy instantly
- Place orders using:
  - 📍 Current GPS location
  - 🧾 UPI-based payment or Cash-on-Delivery
- View past orders with status updates
- Cancel orders manually
- Track order status: Processing / Shipped / Delivered / Rejected

### For Admins:
- Add new products with image, category, stock
- See order count on each product
- View all incoming orders
- Accept / Reject orders
- See user's location on acceptance
- Auto delivery estimate based on distance

---

## 🔧 Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB (via Mongoose)
- **Templating**: EJS
- **Authentication**: Passport.js
- **File Upload**: Multer
- **Geolocation**: OpenStreetMap Nominatim API
- **QR Payment**: Admin QR Code for UPI
