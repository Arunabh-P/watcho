var db = require("../config/connection");
var collection = require("../config/collections");
const bcrypt = require("bcrypt");
const async = require("hbs/lib/async");
const { reject } = require("bcrypt/promises");
var objectId = require("mongodb").ObjectID;
const { ObjectId } = require("mongodb");
const { response } = require("express");
const moment = require("moment");
const Razorpay = require("razorpay");
require("dotenv").config();
var instance = new Razorpay({
  key_id: process.env.RAZOR_ID,
  key_secret: process.env.RAZOR_SECRET,
});

module.exports = {
  // signup
  doSignUpOne: (userdetails) => {
    return new Promise(async (resolve, reject) => {
      var userexists = await db
        .get()
        .collection("user")
        .findOne({ email: userdetails.email });
      var userMOBexists = await db
        .get()
        .collection("user")
        .findOne({ mobile: userdetails.mobile });
      if (!userexists) {
        resolve({ status: true });
      } else if (userMOBexists.mobile) {
        resolve({ MOBExits: true });
      } else {
        resolve({ status: false });
      }
    });
  },

  doSignup: (userData) => {
    return new Promise(async (resolve, reject) => {
      userData.wallet = parseInt(userData.wallet);
      userData.password = await bcrypt.hash(userData.password, 10);
      userData.block = false;
      if (userData.referId) {
        userData.wallet = 100;
        db.get()
          .collection(collection.USER_COLLECTION)
          .insertOne(userData)
          .then((data) => {
            db.get()
              .collection(collection.USER_COLLECTION)
              .updateOne(
                { _id: ObjectId(userData.referId) },
                {
                  $inc: {
                    wallet: 100,
                  },
                }
              );
            resolve(data.insertedId);
          });
      } else {
        db.get()
          .collection(collection.USER_COLLECTION)
          .insertOne(userData)
          .then((data) => {
            resolve(data.insertedId);
          });
      }
    });
  },
  findUser: (mobile) => {
    return new Promise(async (resolve, reject) => {
      let mob = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ mobile: mobile });
      if (mob) {
        let err = "Mobile number already Exists!";
        resolve(err);
      } else {
        reject();
      }
    });
  },

  // signup

  // login

  doLogin: (userData) => {
    let loginStatus = false;
    let response = {};
    return new Promise(async (resolve, reject) => {
      let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ email: userData.email });
      if (user) {
        bcrypt.compare(userData.password, user.password).then((status) => {
          if (user.block == false) {
            if (status) {
              response.user = user;
              response.status = true;
              resolve(response);
            } else {
              reject({ status: false });
            }
          } else {
            reject({ error: "User is blocked by admin" });
          }
        });
      } else {
        reject({ error: "Invalid email or password" });
      }
    });
  },

  // login

  // mobilecheck

  mobileCheck: (number) => {
    return new Promise(async (resolve, reject) => {
      let response = {};
      let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .find({ mobile: number })
        .toArray();
      if (user.length != 0) {
        (response.status = true), (response.user = user);
        resolve(response);
      } else {
        (response.status = false), resolve(response);
      }
    });
  },

  //view users
  getAllUsers: () => {
    return new Promise(async (resolve, reject) => {
      let users = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .find()
        .toArray();
      resolve(users);
    });
  },

  getOneUser: (userId) => {
    return new Promise(async (resolve, reject) => {
      let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ _id: ObjectId(userId) });
      resolve(user);
    });
  },

  updateUser: (upUser) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: ObjectId(upUser.id) },
          {
            $set: {
              name: upUser.name,
              mobile: upUser.mobile,
              email: upUser.email,
            },
          }
        )
        .then((response) => {
          resolve();
        });
    });
  },

  //block users
  blockUser: (userId) => {
    return new Promise(async (resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: ObjectId(userId) },
          {
            $set: { block: true },
          }
        )
        .then((status) => {
          resolve({ blockStatus: true });
        })
        .catch((response) => {});
    });
  },
  //block users

  //Un-block users
  unBlockUser: (userId) => {
    return new Promise(async (resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: ObjectId(userId) },
          {
            $set: { block: false },
          }
        )
        .then((status) => {
          resolve({ blockStatus: true });
        })
        .catch((response) => {});
    });
  },
  //Un-block users

  //cart
  addToCart: (proId, userId) => {
    let proObj = {
      item: ObjectId(proId),
      quantity: 1,
    };
    return new Promise(async (resolve, reject) => {
      let userCart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: ObjectId(userId) });
      if (userCart) {
        let proExist = userCart.products.findIndex(
          (product) => product.item == proId
        );
        if (proExist != -1) {
          db.get()
            .collection(collection.CART_COLLECTION)
            .updateOne(
              { user: ObjectId(userId), "products.item": ObjectId(proId) },
              {
                $inc: { "products.$.quantity": 1 },
              }
            )
            .then(() => {
              resolve();
            });
        } else {
          db.get()
            .collection(collection.CART_COLLECTION)
            .updateOne(
              { user: ObjectId(userId) },
              {
                $push: { products: proObj },
              }
            )
            .then((response) => {
              resolve();
            });
        }
      } else {
        let cartObj = {
          user: ObjectId(userId),
          products: [proObj],
        };
        db.get()
          .collection(collection.CART_COLLECTION)
          .insertOne(cartObj)
          .then((response) => {
            resolve();
          });
      }
    });
  },
  getCart: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: ObjectId(userId) });
      resolve(cart);
    });
  },

  getCartProducts: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cartItems = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .aggregate([
          {
            $match: { user: ObjectId(userId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
        ])
        .toArray();
      resolve(cartItems);
    });
  },
  getCartCount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let count = 0;
      let cart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: ObjectId(userId) });
      if (cart) {
        count = cart.products.length;
      }
      resolve(count);
    });
  },
  changeProductQuantity: (details) => {
    details.count = parseInt(details.count);
    details.quantity = parseInt(details.quantity);
    return new Promise((resolve, reject) => {
      if (details.count == -1 && details.quantity == 1) {
        db.get()
          .collection(collection.CART_COLLECTION)
          .updateOne(
            { _id: ObjectId(details.cart) },
            {
              $pull: { products: { item: ObjectId(details.product) } },
            }
          )
          .then((response) => {
            resolve({ removeProduct: true });
          });
      } else {
        db.get()
          .collection(collection.CART_COLLECTION)
          .updateOne(
            {
              _id: ObjectId(details.cart),
              "products.item": ObjectId(details.product),
            },
            {
              $inc: { "products.$.quantity": details.count },
            }
          )
          .then((response) => {
            resolve({ status: true });
          });
      }
    });
  },
  updateCart: (userId, final, discount) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.CART_COLLECTION)
        .updateOne(
          { user: ObjectId(userId), couponApplied: true },
          {
            $set: {
              finalPrice: final,
              discount: discount,
              couponApplied: false,
            },
          }
        )
        .then(() => {
          resolve();
        })
        .catch(() => {
          reject();
        });
    });
  },
  updateCartWallet: (userId, final) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.CART_COLLECTION)
        .updateOne({ user: ObjectId(userId) }, { $set: { walletFinal: final } })
        .then(() => {
          resolve();
        });
    });
  },

  //address
  addAddress: (address) => {
    address.userId = ObjectId(address.userId);
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.ADDRESS_COLLECTION)
        .insertOne(address)
        .then((data) => {
          resolve(data);
        });
    });
  },
  getAlladdress: (user) => {
    let userId = ObjectId(user._id);
    return new Promise(async (resolve, reject) => {
      let address = await db
        .get()
        .collection(collection.ADDRESS_COLLECTION)
        .find({ userId: userId })
        .toArray();
      resolve(address);
    });
  },
  getUserDetails: (userId) => {
    return new Promise(async (resolve, reject) => {
      let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ _id: ObjectId(userId) });
      resolve(user);
    });
  },

  getOneAddress: (addressId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.ADDRESS_COLLECTION)
        .findOne({ _id: ObjectId(addressId) })
        .then((addressDetails) => {
          resolve(addressDetails);
        });
    });
  },

  updateAddress: (upAddress) => {
    upAddress.id = ObjectId(upAddress.id);
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.ADDRESS_COLLECTION)
        .updateOne(
          { _id: upAddress.id },
          {
            $set: {
              name: upAddress.name,
              state: upAddress.state,
              city: upAddress.city,
              zip: upAddress.zip,
              mobile: upAddress.mobile,
              email: upAddress.email,
              address: upAddress.address,
            },
          },
          { upsert: true }
        )
        .then((response) => {
          resolve();
        });
    });
  },

  deleteAddress: (id) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.ADDRESS_COLLECTION)
        .deleteOne({ _id: ObjectId(id) })
        .then((response) => {
          resolve(response);
        });
    });
  },

  deleteCartItem: (id, userId, proId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.CART_COLLECTION)
        .updateOne(
          { _id: ObjectId(id), user: ObjectId(userId) },
          { $pull: { products: { item: ObjectId(proId) } } }
        )
        .then((res) => {
          resolve();
        });
    });
  },

  getTotalAmount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let total = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .aggregate([
          {
            $match: { user: ObjectId(userId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: { $multiply: ["$quantity", "$product.price"] } },
            },
          },
        ])
        .toArray();

      resolve(total[0]?.total);
    });
  },
  getTotalOfferAmount: (userId) => {},

  getUserAddress: (addressid) => {
    return new Promise(async (resolve, reject) => {
      let address = await db
        .get()
        .collection(collection.ADDRESS_COLLECTION)
        .findOne({ _id: ObjectId(addressid) });
      resolve(address);
    });
  },

  placeOrder: (order, products, total, userAddress) => {
    userId = order.userId;
    return new Promise((resolve, reject) => {
      let status = order["payment-method"] === "COD" ? "placed" : "pending";
      let orderObj = {
        deliveryDetails: userAddress,
        userId: ObjectId(order.userId),
        paymentMethod: order["payment-method"],
        products: products,
        totalAmount: total,
        status: status,
        date: new Date(),

        cancel: false,
      };
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .insertOne(orderObj)
        .then((data) => {
          db.get()
            .collection(collection.USER_COLLECTION)
            .updateOne(
              { _id: ObjectId(order.userId) },
              {
                $unset: { couponamount: "" },
              }
            );

          if (order["payment-method"] === "COD") {
            db.get()
              .collection(collection.CART_COLLECTION)
              .deleteOne({ user: ObjectId(order.userId) });
          }

          resolve(data.insertedId);
        });
      // db.get().collection(collection.USER_COLLECTION).updateOne({ _id: ObjectId(userID) }, {
      //     $unset: { couponamount: "" }
      // })
    });
  },

  getCartProductList: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: ObjectId(userId) });
      resolve(cart.products);
    });
  },

  //order

  getUserOrders: (userId) => {
    return new Promise(async (resolve, reject) => {
      let orders = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .find({ userId: ObjectId(userId) })
        .toArray();
      resolve(orders);
    });
  },

  changeStatus: (status, id) => {
    let newStatus = status;
    return new Promise(async (resolve, reject) => {
      if (newStatus == "cancel") {
        await db
          .get()
          .collection(collection.ORDER_COLLECTION)
          .updateOne(
            { _id: ObjectId(id) },
            {
              $set: {
                status: false,
                deliveredStatus: false,
                cancelStatus: true,
              },
            },
            {
              upsert: true,
            }
          )
          .then(() => {
            resolve();
          });
      } else if (newStatus == "delivered") {
        let order = await db
          .get()
          .collection(collection.ORDER_COLLECTION)
          .findOne({ _id: ObjectId(id) });
        db.get().collection(collection.DELIVERED_COLLECTION).insertOne(order),
          await db
            .get()
            .collection(collection.ORDER_COLLECTION)
            .updateOne(
              { _id: ObjectId(id) },

              {
                $set: {
                  status: false,
                  cancelStatus: false,
                  dispatchedStatus: false,
                  deliveryStatus: true,
                },
              },
              {
                upsert: true,
              }
            )
            .then(() => {
              resolve();
            });
      } else if (newStatus == "proccessing") {
        await db
          .get()
          .collection(collection.ORDER_COLLECTION)
          .updateOne(
            { _id: ObjectId(id) },
            {
              $set: {
                status: false,
                cancelStatus: false,
                deliveryStatus: false,
                proccessingStatus: true,
              },
            },
            {
              upsert: true,
            }
          )
          .then(() => {
            resolve();
          });
      } else if (newStatus == "dispatched") {
        await db
          .get()
          .collection(collection.ORDER_COLLECTION)
          .updateOne(
            { _id: ObjectId(id) },
            {
              $set: {
                status: false,
                cancelStatus: false,
                deliveryStatus: false,
                proccessingStatus: false,
                dispatchedStatus: true,
              },
            },
            {
              upsert: true,
            }
          )
          .then(() => {
            resolve();
          });
      } else if (newStatus == "return") {
        await db
          .get()
          .collection(collection.ORDER_COLLECTION)
          .updateOne(
            { _id: ObjectId(id) },
            {
              $set: {
                status: false,
                cancelStatus: false,
                deliveryStatus: false,
                proccessingStatus: false,
                dispatchedStatus: false,
                returnStatus: true,
              },
            },
            {
              upsert: true,
            }
          )
          .then(() => {
            resolve();
          });
      }
    });
  },
  getOrderDetails: (orderId) => {
    orderId = ObjectId(orderId);
    return new Promise(async (resolve, reject) => {
      let orderItems = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $match: { _id: orderId },
          },
          {
            $unwind: "$products",
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "products.item",
              foreignField: "_id",
              as: "orders",
            },
          },
          {
            $unwind: "$orders",
          },
        ])
        .toArray();
      resolve(orderItems);
    });
  },

  getAllOrders: () => {
    return new Promise(async (resolve, reject) => {
      let allOrders = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .find()
        .toArray();
      resolve(allOrders);
    });
  },

  //sales report
  getsalesReport: () => {
    return new Promise(async (resolve, reject) => {
      let orderItems = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $match: { deliveryStatus: true },
          },
          {
            $project: {
              orderId: "$orderId",
              userId: "$userId",
              paymentMethod: "$paymentMethod",
              totalAmount: "$totalAmount",
              date: "$date",
              products: "$products",
            },
          },
        ])
        .toArray();
      resolve(orderItems);
    });
  },

  getweeklyreport: async () => {
    const dayOfYear = (date) =>
      Math.floor(
        (date - new Date(date.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24
      );
    return new Promise(async (resolve, reject) => {
      const data = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $match: {
              $and: [
                { status: { $ne: "cancelled" } },
                { status: { $ne: "pending" } },
              ],
              date: { $gte: new Date(new Date() - 7 * 60 * 60 * 24 * 1000) },
            },
          },

          { $group: { _id: { $dayOfYear: "$date" }, count: { $sum: 1 } } },
        ])
        .toArray();
      const thisday = dayOfYear(new Date());
      let salesOfLastWeekData = [];
      for (let i = 0; i < 8; i++) {
        let count = data.find((d) => d._id === thisday + i - 7);

        if (count) {
          salesOfLastWeekData.push(count.count);
        } else {
          salesOfLastWeekData.push(0);
        }
      }
      resolve(salesOfLastWeekData);
    });
  },

  getSalesReport: (from, to) => {
    return new Promise(async (resolve, reject) => {
      let orders = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $match: {
              $and: [
                { date: { $gte: new Date(from), $lte: new Date(to) } },
                { deliveryStatus: true },
              ],
            },
          },
        ])
        .toArray();
      resolve(orders);
    });
  },

  getNewSalesReport: (type) => {
    const numberOfDays =
      type === "daily"
        ? 1
        : type === "weekly"
        ? 7
        : type === "monthly"
        ? 30
        : type === "yearly"
        ? 365
        : 0;
    const dayOfYear = (date) =>
      Math.floor(
        (date - new Date(date.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24
      );
    return new Promise(async (resolve, reject) => {
      const data = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $match: {
              date: {
                $gte: new Date(new Date() - numberOfDays * 60 * 60 * 24 * 1000),
              },
            },
          },
        ])
        .toArray();
      resolve(data);
    });
  },
  getNewSalesReport: (type) => {
    const numberOfDays =
      type === "daily"
        ? 1
        : type === "weekly"
        ? 7
        : type === "monthly"
        ? 30
        : type === "yearly"
        ? 365
        : 0;
    const dayOfYear = (date) =>
      Math.floor(
        (date - new Date(date.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24
      );
    return new Promise(async (resolve, reject) => {
      const data = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $match: {
              $and: [
                {
                  date: {
                    $gte: new Date(
                      new Date() - numberOfDays * 60 * 60 * 24 * 1000
                    ),
                  },
                },
                { deliveryStatus: true },
              ],
            },
          },
        ])
        .toArray();
      resolve(data);
    });
  },

  //sales report

  //wishlist
  //add to wishlist

  addToWishlist: (proId, userId) => {
    let proObj = {
      item: ObjectId(proId),
    };
    return new Promise(async (resolve, reject) => {
      let userWishlist = await db
        .get()
        .collection(collection.WISHLIST_COLLECTION)
        .findOne({ user: ObjectId(userId) });
      if (userWishlist) {
        let proExist = userWishlist.products.findIndex(
          (product) => product.item == proId
        );
        if (proExist != -1) {
          resolve({ alreadyexist: true });
        } else {
          db.get()
            .collection(collection.WISHLIST_COLLECTION)
            .updateOne(
              { user: ObjectId(userId) },
              {
                $push: { products: proObj },
              }
            )
            .then((response) => {
              resolve({ added: true });
            });
        }
      } else {
        let wishlistObj = {
          user: ObjectId(userId),
          products: [proObj],
        };
        db.get()
          .collection(collection.WISHLIST_COLLECTION)
          .insertOne(wishlistObj)
          .then((response) => {
            resolve({ added: true });
          });
      }
    });
  },

  getWishlistProducts: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cartItems = await db
        .get()
        .collection(collection.WISHLIST_COLLECTION)
        .aggregate([
          {
            $match: { user: ObjectId(userId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
        ])
        .toArray();
      resolve(cartItems);
    });
  },
  getWishlistCount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let count = 0;
      let wishlist = await db
        .get()
        .collection(collection.WISHLIST_COLLECTION)
        .findOne({ user: ObjectId(userId) });
      if (wishlist) {
        count = wishlist.products.length;
      }
      resolve(count);
    });
  },
  changeWishlistProductQuantity: (details) => {
    details.count = parseInt(details.count);
    details.quantity = parseInt(details.quantity);
    return new Promise((resolve, reject) => {
      if (details.count == -1 && details.quantity == 1) {
        db.get()
          .collection(collection.WISHLIST_COLLECTION)
          .updateOne(
            { _id: ObjectId(details.wishlist) },
            {
              $pull: { products: { item: ObjectId(details.product) } },
            }
          )
          .then((response) => {
            resolve({ removeProduct: true });
          });
      } else {
        db.get()
          .collection(collection.WISHLIST_COLLECTION)
          .updateOne(
            {
              _id: ObjectId(details.wishlist),
              "products.item": ObjectId(details.product),
            },
            {
              $inc: { "products.$.quantity": details.count },
            }
          )
          .then((response) => {
            resolve({ status: true });
          });
      }
    });
  },
  deleteWishlistItem: (id, userId, proId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.WISHLIST_COLLECTION)
        .updateOne(
          { _id: ObjectId(id), user: ObjectId(userId) },
          { $pull: { products: { item: ObjectId(proId) } } }
        )
        .then((res) => {
          resolve();
        });
    });
  },

  //razopay

  generateRazorpay: (orderId, total) => {
    return new Promise((resolve, reject) => {
      var options = {
        amount: total * 100,
        currency: "INR",
        receipt: "" + orderId,
        notes: {
          key1: "order for watcho",
        },
      };
      instance.orders.create(options, function (err, order) {
        if (err) {
          console.log(err);
        } else {
          resolve(order);
        }
      });
    });
  },
  verifyPayment: (details) => {
    return new Promise((resolve, reject) => {
      const crypto = require("crypto");
      let hmac = crypto.createHmac("sha256", "FUfO8E5AZcB0uAxWIApFfNra");
      hmac.update(
        details["payment[razorpay_order_id]"] +
          "|" +
          details["payment[razorpay_payment_id]"]
      );
      hmac = hmac.digest("hex");
      if (hmac == details["payment[razorpay_signature]"]) {
        resolve();
      } else {
        reject();
      }
    });
  },

  changePaymentStatus: (orderId, userID) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .updateOne(
          { _id: ObjectId(orderId) },
          {
            $set: {
              status: "placed",
            },
          }
        )
        .then(() => {
          db.get()
            .collection(collection.CART_COLLECTION)
            .deleteOne({ user: ObjectId(userID) })
            .then(() => {
              resolve();
            });
        });
    });
  },

  //Password
  changePassword: (data) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .findOne({ _id: ObjectId(data.userID) })
        .then((user) => {
          bcrypt
            .compare(data.currentpassword, user.password)
            .then(async (status) => {
              if (status) {
                newpassword = await bcrypt.hash(data.password, 10);
                confirmpassword = await bcrypt.hash(data.confirmpassword, 10);
                await db
                  .get()
                  .collection(collection.USER_COLLECTION)
                  .updateOne(
                    { _id: ObjectId(data.userID) },
                    {
                      $set: {
                        password: newpassword,
                        confirmpassword: confirmpassword,
                      },
                    }
                  );
                resolve({ status: true });
              } else {
                resolve({ status: false });
              }
            });
        });
    });
  },

  getUserWallet: (userId) => {
    return new Promise((resolve, reject) => {
      let user = db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ _id: ObjectId(userId) })
        .then((user) => {
          resolve(user);
        });
    });
  },
  
  searchProducts: (search) => {
    return new Promise(async (resolve, reject) => {
        try {
            const products = await db
                .get()
                .collection(collection.PRODUCT_COLLECTION)
                .find({
                  name: {
                        $regex: search,
                        $options: 'i'
                    },
                })
                .toArray();

            resolve(products);
        } catch (err) {
            console.error(err);
            reject([]);
        }
    });
},




};
