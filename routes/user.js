const { response } = require("express");
var express = require("express");
const res = require("express/lib/response");
var router = express.Router();
const productHelpers = require("../helpers/product-helpers");
const userHelpers = require("../helpers/user-helpers");
const twilio = require("twilio");
const banerHelpers = require("../helpers/baner-helpers");
const async = require("hbs/lib/async");
const { reject } = require("bcrypt/promises");
const { post } = require("./admin");
const paypal = require("paypal-rest-sdk");
const { helpers } = require("handlebars");
const offerHelpers = require("../helpers/offerHelpers");
const categoryOfferHelpers = require("../helpers/category-offer-helpers");
const couponHelpers = require("../helpers/coupon-helpers");
require("dotenv").config();

//----------------------------------------------------------------twilio--------------------------------------------------------------------

const accountSid = process.env.ACCOUNT_SID;
const authToken = process.env.AUTH_TOKEN;
const serviceSID = process.env.SERVICE_SID;
const client = new twilio(accountSid, authToken);
let OTP;

//----------------------------------------------------------------paypal--------------------------------------------------------------------

// paypal.configure({
//   mode: "sandbox", //sandbox or live
//   client_id:
//     "AeDRHFRDC_k6pyjqoMb-DPb4QusDT__n8fqnbCrApPsK1kcfCPLVMu3o5Brdk9mN6z5PtRiymci-jmj_",
//   client_secret:
//     "EMnbxPCI4k9pLDL-pOQn2pqs7nHsWrEOiLtnOhfSs9ez3syQoti0YUZMPI8wUliTnQpI7D54uFa5vx9i",
// });
paypal.configure({
  mode: "sandbox", //sandbox or live
  client_id:process.env.client_id,
  client_secret:process.env.client_secret,
});
//--------------------------------------------------------------verifyLogin------------------------------------------------------------------

function verifyLogin(req, res, next) {
  if (req.session.loggedIn) {
    next();
  } else {
    res.redirect("/");
  }
}

//----------------------------------------------------------------Home Page-------------------------------------------------------------------

router.get("/", async function (req, res, next) {
  let user = req.session.user;
  let cartCount = null;
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id);
  }
  let wishlistCount = null;
  if (req.session.user) {
    wishlistCount = await userHelpers.getWishlistCount(req.session.user._id);
  }
  let category = await productHelpers.getCategory();
  let product = await productHelpers.getAllProducts();
  let ExclusiveProduct = await productHelpers.getAllExclusiveProducts();
  let menWomenBaner = await productHelpers.getAllMenWomenBaner();
  let Baner = await banerHelpers.getallbaners();
  res.render("index", {
    admin: false,
    product,
    ExclusiveProduct,
    Baner,
    category,
    user,
    cartCount,
    wishlistCount,
    menWomenBaner,
    indexFooter:true
  });
});

//-------------------------------------------------------------------login----------------------------------------------------------------------

// Get login
router.get("/login", (req, res) => {
  if (req.session.loggedIn) {
    res.redirect("/");
  } else {
    res.render("user/login", {
      login: true,
      error: req.session.loginErr,
      noheader: true,
    });
    req.session.loginErr = false;
  }
});

// Post login
router.post("/login", (req, res) => {
  userHelpers
    .doLogin(req.body)
    .then((response) => {
      if (response.status) {
        req.session.user = response.user;
        req.session.loggedIn = true;
        req.session.loginErr = null;
        res.redirect("/");
      } else {
        req.session.loginErr = "Sorry this account is blocked";
        res.redirect("/login");
      }
    })
    .catch((err) => {
      req.session.loginErr = "Invalid User Details";
      res.redirect("/login");
    });
});

// Get login with mobile
router.get("/login/login-mobile", (req, res) => {
  res.render("user/login-mobile", {
    login: true,
    error: req.session.verifyErr,
    noheader: true,
  });
  req.session.verifyErr = false;
});

//Post generate otp
router.post("/login/otp", (req, res) => {
  userHelpers.mobileCheck(req.body.number).then((response) => {
    if (response.status) {
      req.session.user = response.user[0];
      req.session.number = req.body.number;
      client.verify
        .services(serviceSID)
        .verifications.create({ to: "+91" + req.body.number, channel: "sms" })
        .then((verification) => console.log(verification.status));
      res.render("user/otp", { login: true, noheader: true });
    } else {
      let Moberr = "Please enter registerd Mobile Number";
      res.render("user/login-mobile", { Moberr, login: true, noheader: true });
    }
  });
});

//Post OTP login verify
router.post("/login/varify", (req, res) => {
  let number = req.session.number;
  client.verify
    .services(serviceSID)
    .verificationChecks.create({ to: "+91" + number, code: req.body.otp })
    .then((verification_check) => {
      let loginOtpFinal = verification_check.status;
      if (loginOtpFinal == "approved") {
        req.session.loggedIn = true;
        res.redirect("/");
      } else {
        let otpErr = "Invalid OTP number";
        res.render("user/otp", { otpErr, login: true, noheader: true });
        otpErr = null;
      }
    });
});
// Get logout
router.get("/logout", (req, res) => {
  req.session.user = null;
  req.session.loggedIn = false;
  res.redirect("/");
});

//-------------------------------------------------------------------signup----------------------------------------------------------------------

// Get signup
router.get("/signup", (req, res) => {
  res.render("user/signup", {
    sign: true,
    noheader: true,
    signupErr: req.session.signupErr,
  });
});

// Referal signup
router.get("/signup/:id", (req, res) => {
  req.session.referId = req.params.id;
  res.render("user/signup", { sign: true, noheader: true });
});

// Post signup
router.post("/signup", (req, res) => {
  client.verify
    .services(serviceSID)
    .verifications.create({ to: "+91" + req.body.mobile, channel: "sms" })
    .then((verification) => console.log(verification.status));
  userHelpers
    .findUser(req.body.mobile)
    .then((err) => {
      req.session.signupErr = err;
      res.redirect("/signup");
    })
    .catch(() => {
      res.render("user/signup-otp.hbs", {
        data: req.body,
        login: true,
        noheader: true,
      });
    });
});

// Post signup OTP
router.post("/signup-otp", (req, res) => {
  req.body.referId = req.session.referId;
  client.verify
    .services(serviceSID)
    .verificationChecks.create({
      to: "+91" + req.body.mobile,
      code: req.body.otp,
    })
    .then((verification_check) => {
      let signupOtpFinal = verification_check.status;
      if (signupOtpFinal == "approved") {
        delete req.body.otp;
        userHelpers.doSignup(req.body).then((response) => {
          res.redirect("/login");
        });
      } else {
        delete req.body.otp;
        res.render("user/signup-otp.hbs", {
          data: req.body,
          login: true,
          noheader: true,
        });
      }
    });
});

//-------------------------------------------------------------------Products----------------------------------------------------------------------

//Post products
router.post("/products", (req, res) => {
  res.redirect("user/category");
});

//Get products
router.get("/products", async (req, res) => {
  let user = req.session.user;
  let cartCount = null;
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id);
  }
  let wishlistCount = null;
  if (req.session.user) {
    wishlistCount = await userHelpers.getWishlistCount(req.session.user._id);
  }
  let cat = req.query.cat;
  let product = await productHelpers.getAllProductsByCat(cat);
  res.render("user/category", { product, cartCount, user, cat, wishlistCount ,indexFooter:true});
});


//Post Products sub category
router.post("/product-sub", (req, res) => {
  res.redirect("user/sub-category");
});

//Get Products sub category
router.get("/product-sub", async (req, res) => {
  let user = req.session.user;
  let cat = req.query.cat;
  let subCat = req.query.subCat;
  let cartCount = null;
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id);
  }
  let wishlistCount = null;
  if (req.session.user) {
    wishlistCount = await userHelpers.getWishlistCount(req.session.user._id);
  }
  let product = await productHelpers.getAllProductsBySubCat(cat, subCat);
  res.render("user/sub-category", {
    product,
    user,
    cartCount,
    cat,
    wishlistCount,
    indexFooter:true
  });
});

//Get product landing page
router.get("/product/:id", async (req, res) => {
  let prodId = req.params.id;
  let cartCount = null;
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id);
  }
  let wishlistCount = null;
  if (req.session.user) {
    wishlistCount = await userHelpers.getWishlistCount(req.session.user._id);
  }
  productHelpers.getAproduct(prodId).then((product) => {
    let cat = req.session.cat;
    let user = req.session.user;
    res.render("user/product-landing-page", {
      product,
      user,
      cat,
      cartCount,
      wishlistCount,
      indexFooter:true
    });
  });
});

//-------------------------------------------------------------------Cart----------------------------------------------------------------------

//Get cart
router.get("/cart", verifyLogin, async (req, res) => {
  let user = req.session.user;
  let cartCount = null;
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id);
  }
  let wishlistCount = null;
  if (req.session.user) {
    wishlistCount = await userHelpers.getWishlistCount(req.session.user._id);
  }
  let products = await userHelpers.getCartProducts(req.session.user._id);
  let total = 0;
  if (products.length > 0) {
    total = await userHelpers.getTotalAmount(req.session.user._id);
  }
  res.render("user/cart", { user, products, total, cartCount, wishlistCount,indexFooter:true });
});

//Get Add to cart
router.get("/add-to-cart/:id", (req, res) => {
  userHelpers.addToCart(req.params.id, req.session.user._id).then(() => {
    res.json({ status: true });
  });
});

//Post change product quantity in cart
router.post("/change-product-quantity", (req, res, next) => {
  userHelpers.changeProductQuantity(req.body).then(async (response) => {
    response.total = await userHelpers.getTotalAmount(req.body.user);
    res.json(response);
  });
});

//delete cart product
router.get("/delete-cart-item", verifyLogin, (req, res) => {
  userHelpers
    .deleteCartItem(req.query.id, req.session.user._id, req.query.proId)
    .then(() => {
      res.redirect("/cart");
    });
});

//-------------------------------------------------------------------Address----------------------------------------------------------------------

//GET address
router.get("/address", verifyLogin, async (req, res) => {
  let user = req.session.user;
  let cartCount = null;
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id);
  }
  let wishlistCount = null;
  if (req.session.user) {
    wishlistCount = await userHelpers.getWishlistCount(req.session.user._id);
  }
  res.render("user/address", { user, cartCount, wishlistCount ,indexFooter:true});
});

//post address
router.post("/address", verifyLogin, (req, res) => {
  req.body.userId = req.session.user._id;
  userHelpers.addAddress(req.body).then((response) => {
    res.redirect("/place-order");
  });
});

//GET edit address
router.get("/edit-address/:id", verifyLogin, async (req, res) => {
  let cartCount = null;
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id);
  }
  let wishlistCount = null;
  if (req.session.user) {
    wishlistCount = await userHelpers.getWishlistCount(req.session.user._id);
  }
  let user = req.session.user;
  await userHelpers.getOneAddress(req.params.id).then((addressDetails) => {
    if (req.session.user._id != addressDetails.userId) {
      res.render("user/error_user_not_accessible", {
        sign: true,
        noheader: true,
      });
    }
    res.render("user/edit-address", {
      user,
      addressDetails,
      cartCount,
      wishlistCount,
      indexFooter:true
    });
  });
});

//POST edit address
router.post("/edit-address", verifyLogin, (req, res) => {
  let user = req.session.user;
  userHelpers.updateAddress(req.body).then(() => {
    res.redirect("/place-order");
  });
});

//Get delete address
router.get("/delete-address/:id", verifyLogin, (req, res) => {
  userHelpers.deleteAddress(req.params.id).then((response) => {
    res.redirect("/place-order");
  });
});


//----------------------------------------------------------------Place-order-------------------------------------------------------------------

// Get place-order
router.get("/place-order", verifyLogin, async (req, res) => {
  let user = req.session.user;
  let userDetails = await userHelpers.getOneUser(req.session.user._id);
  let cartCount = null;
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id);
  }
  let wishlistCount = null;
  if (req.session.user) {
    wishlistCount = await userHelpers.getWishlistCount(req.session.user._id);
  }
  await userHelpers.getAlladdress(user).then((address) => {
    userHelpers.getTotalAmount(req.session.user._id).then((total) => {
      if (userDetails.couponamount) {
        var grandTotal = total - (userDetails.couponamount * total) / 100;
      } else {
        grandTotal = total;
      }
      let discount = userDetails.couponamount;
      let wallet = null;
      if (userDetails.wallet != 0) {
        wallet = userDetails.wallet;
      }
      res.render("user/place-order", {
        wallet,
        user,
        grandTotal,
        address,
        total,
        cartCount,
        wishlistCount,
        discount,
        indexFooter:true
      });
    });
  });
});

//post place order
router.post("/place-order", verifyLogin, async (req, res) => {
  let userAddress = await userHelpers.getUserAddress(req.body.addressid);
  let products = await userHelpers.getCartProductList(req.body.userId);
  let total = await userHelpers.getTotalAmount(req.body.userId);
  let discount = null;

  let user = await userHelpers.getOneUser(req.body.userId);
  if (user.couponamount) {
    discount = user.couponamount;
    total = total - (discount * total) / 100;
  }
  if (req.body.checked) {
    let walletAmount = req.body.checked;
    total = total - walletAmount;
  }
  req.session.totalAmount = total;
  userHelpers
    .placeOrder(req.body, products, total, userAddress)
    .then((orderId) => {
      req.session.orderId = orderId;
      if (req.body["payment-method"] === "COD") {
        res.send({ codSuccess: true });
      } else if (req.body["payment-method"] === "ONLINE") {
        userHelpers
          .generateRazorpay(orderId, total, userAddress)
          .then((response) => {
            res.json(response);
          });
      } else if (req.body["payment-method"] === "PAYPAL") {
        req.session.orderId = orderId;
        const create_payment_json = {
          intent: "sale",
          payer: {
            payment_method: "paypal",
          },
          redirect_urls: {
            return_url: "http://localhost:3000/success",
            cancel_url: "http://localhost:3000/cancel",
          },
          transactions: [
            {
              item_list: {
                items: [
                  {
                    name: orderId,
                    sku: "001",
                    price: total,
                    currency: "USD",
                    quantity: 1,
                  },
                ],
              },
              amount: {
                currency: "USD",
                total: total,
              },
              description: "order for watcho",
            },
          ],
        };
        paypal.payment.create(create_payment_json, function (error, payment) {
          if (error) {
            throw error;
          } else {
            for (let i = 0; i < payment.links.length; i++) {
              if (payment.links[i].rel === "approval_url") {
                res.json({ paypal: true, val: payment.links[i].href });
              }
            }
          }
        });
      }
    });
});

//----------------------------------------------------------------Order success-------------------------------------------------------------------

//Get order success
router.get("/success", (req, res) => {
  let total = req.session.totalAmount;
  let user = req.session.user._id;
  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;
  const execute_payment_json = {
    payer_id: payerId,
    transactions: [
      {
        amount: {
          currency: "USD",
          total: total,
        },
      },
    ],
  };
  paypal.payment.execute(
    paymentId,
    execute_payment_json,
    function (error, payment) {
      if (error) {
        throw error;
      } else {
        userHelpers.changePaymentStatus(req.session.orderId, user).then(() => {
          res.redirect("/order-success");
        });
      }
    }
  );
});

//Get cancel
router.get("/cancel", (req, res) => {
  redirect("/");
});

// Razorpay online payment
router.post("/verify-payment", (req, res) => {
  userHelpers
    .verifyPayment(req.body)
    .then(() => {
      userHelpers
        .changePaymentStatus(req.body["order[receipt]"], req.session.user._id)
        .then(() => {
          res.json({ status: true });
        });
    })
    .catch((err) => {
      res.json({ status: false, errMsg: "error occurred" });
    });
});



//---------------------------------------------------------------------Order------------------------------------------------------------------------
//Get order status change
router.get("/status-change", (req, res) => {
  let status = req.query.status;
  let id = req.query.id;
  userHelpers.changeStatus(status, id).then((data) => {
    res.redirect("/orders");
  });
});

//Get order
router.get("/orders", verifyLogin, async (req, res) => {
  let user = req.session.user;
  let cartCount = null;
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id);
  }
  let wishlistCount = null;
  if (req.session.user) {
    wishlistCount = await userHelpers.getWishlistCount(req.session.user._id);
  }
  let orders = await userHelpers.getUserOrders(req.session.user._id);
  res.render("user/orders", { user, orders, cartCount, wishlistCount,indexFooter:true });
});

//Get order success
router.get("/order-success", async (req, res) => {
  let user = req.session.user;
  let cartCount = null;
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id);
  }
  let wishlistCount = null;
  if (req.session.user) {
    wishlistCount = await userHelpers.getWishlistCount(req.session.user._id);
  }
  res.render("user/order-success", { user, cartCount, wishlistCount,indexFooter:true });
});

//Get user order details
router.get("/view-order-products/:id", verifyLogin, async (req, res) => {
  let user = req.session.user;
  let cartCount = null;
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id);
  }
  let wishlistCount = null;
  if (req.session.user) {
    wishlistCount = await userHelpers.getWishlistCount(req.session.user._id);
  }
  await userHelpers.getOrderDetails(req.params.id).then((orderDetails) => {
    address = orderDetails[0].deliveryDetails;
    orderId = orderDetails[0]._id;
    orderStatus = orderDetails[0].status;
    cancelStatus = orderDetails[0].cancelStatus;
    deliveryStatus = orderDetails[0].deliveryStatus;

    if (orderStatus == "placed") {
      orderStatus = true;
    }
    res.render("user/view-order-products", {
      user,
      orderDetails,
      address,
      cartCount,
      orderId,
      wishlistCount,
      orderStatus,
      cancelStatus,
      deliveryStatus,
      indexFooter:true
    });
  });
});

// get cancel order
router.get("/cancel-order", (req, res) => {
  userHelpers.changeStatus(req.query.status, req.query.id).then((response) => {
    res.redirect("/view-order-products");
  });
});

// ===========================================================USER PROFILE SECTION=================================================================
// ------------------------------------------------------------------Addresss----------------------------------------------------------------------

//Get profile address
router.get("/profile-address", verifyLogin, async (req, res) => {
  let user = req.session.user;
  let cartCount = null;
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id);
  }
  let wishlistCount = null;
  if (req.session.user) {
    wishlistCount = await userHelpers.getWishlistCount(req.session.user._id);
  }
  await userHelpers.getAlladdress(user).then((address) => {
    res.render("user/profile-address", {
      user,
      address,
      cartCount,
      wishlistCount,
      indexFooter:true
    });
  });
});

//Get add profile address
router.get("/add-profile-address", verifyLogin, async (req, res) => {
  let user = req.session.user;
  let cartCount = null;
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id);
  }
  let wishlistCount = null;
  if (req.session.user) {
    wishlistCount = await userHelpers.getWishlistCount(req.session.user._id);
  }
  res.render("user/add-profile-address", { user, cartCount, wishlistCount,indexFooter:true });
});

//Post add profile address
router.post("/add-profile-address", verifyLogin, (req, res) => {
  req.body.userId = req.session.user._id;
  userHelpers.addAddress(req.body).then((response) => {
    res.redirect("/profile-address");
  });
});

//Get edit profile address
router.get("/edit-profile-address/:id", verifyLogin, async (req, res) => {
  let user = req.session.user;
  let cartCount = null;
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id);
  }
  let wishlistCount = null;
  if (req.session.user) {
    wishlistCount = await userHelpers.getWishlistCount(req.session.user._id);
  }
  await userHelpers.getOneAddress(req.params.id).then((addressDetails) => {
    if (req.session.user._id != addressDetails.userId) {
      res.render("user/error_user_not_accessible", {
        sign: true,
        noheader: true,
      });
    }
    res.render("user/edit-profile-address", {
      user,
      addressDetails,
      cartCount,
      wishlistCount,
      indexFooter:true
    });
  });
});

//Post edit profile address
router.post("/edit-profile-address", verifyLogin, (req, res) => {
  let user = req.session.user;
  userHelpers.updateAddress(req.body).then(() => {
    res.redirect("/profile-address");
  });
});

//Get delete profile address
router.get("/delete-profile-address/:id", verifyLogin, (req, res) => {
  userHelpers.deleteAddress(req.params.id).then((response) => {
    res.redirect("/profile-address");
  });
});

// ------------------------------------------------------------------Addresss----------------------------------------------------------------------

//Get user profile
router.get("/user-profile", verifyLogin, async (req, res) => {
  let user = req.session.user;
  let cartCount = null;
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id);
  }
  let wishlistCount = null;
  if (req.session.user) {
    wishlistCount = await userHelpers.getWishlistCount(req.session.user._id);
  }
  await userHelpers.getOneUser(req.session.user._id).then((user) => {
    res.render("user/user-profile", { user, cartCount, wishlistCount,indexFooter:true });
  });
});

//GET edit user profile details
router.get("/edit-profile-details/:id", verifyLogin, async (req, res) => {
  let user = req.session.user;
  let cartCount = null;
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id);
  }
  let wishlistCount = null;
  if (req.session.user) {
    wishlistCount = await userHelpers.getWishlistCount(req.session.user._id);
  }
  if (req.session.user._id != req.params.id) {
    res.render("user/error_user_not_accessible", {
      sign: true,
      noheader: true,
    });
  }
  userHelpers.getOneUser(req.params.id).then((user) => {
    res.render("user/edit-profile-details", { user, cartCount, wishlistCount ,indexFooter:true});
  });
});

//Post edit user profile details
router.post("/edit-profile-details", verifyLogin, (req, res) => {
  let user = req.session.user;
  userHelpers.updateUser(req.body).then(() => {
    res.redirect("/user-profile");
  });
});

// ------------------------------------------------------------------Wishlist----------------------------------------------------------------------

//Get wishlist
router.get("/wishlist", verifyLogin, async (req, res) => {
  let user = req.session.user;
  let cartCount = null;
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id);
  }
  let wishlistCount = null;
  if (req.session.user) {
    wishlistCount = await userHelpers.getWishlistCount(req.session.user._id);
  }
  let products = await userHelpers.getWishlistProducts(req.session.user._id);
  let total = 0;
  if (products.length > 0) {
    total = await userHelpers.getTotalAmount(req.session.user._id);
  }
  res.render("user/wishlist", { user, products, wishlistCount, cartCount,indexFooter:true });
});

//Get add to wishlist
router.get("/add-to-wishlist/:id", verifyLogin, (req, res) => {
  userHelpers
    .addToWishlist(req.params.id, req.session.user._id)
    .then((response) => {
      if (response.added) {
        res.json({ status: true });
      } else if (response.alreadyexist) {
        res.json({ alreadyexist: true });
      }
    });
});

//Post Change wishlist product quantity
router.post("/change-wishlist-product-quantity", (req, res, next) => {
  userHelpers.changeWishlistProductQuantity(req.body).then(async (response) => {
    res.json(response);
  });
});

//Get delete wishlist product
router.get("/delete-wishlist-item", verifyLogin, (req, res) => {
  userHelpers
    .deleteWishlistItem(req.query.id, req.session.user._id, req.query.proId)
    .then(() => {
      res.redirect("/wishlist");
    });
});

// ------------------------------------------------------------------Password----------------------------------------------------------------------

//Get change password
router.get("/change-password", verifyLogin, async (req, res) => {
  let user = req.session.user;
  let cartCount = null;
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id);
  }
  let wishlistCount = null;
  if (req.session.user) {
    wishlistCount = await userHelpers.getWishlistCount(req.session.user._id);
  }
  if (req.query.valid) {
    var passwordError = req.query.valid;
  }
  res.render("user/change-password", {
    user,
    passwordError,
    cartCount,
    wishlistCount,
    indexFooter:true
  });
});

//Post change password
router.post("/change-password", (req, res) => {
  userHelpers.changePassword(req.body).then((response) => {
    if (response.status) {
      req.session.user = null;
      req.session.loggedIn = false;
      res.redirect("/login");
    } else {
      var string = encodeURIComponent("Enter the correct password");
      res.redirect("/change-password?valid=" + string);
    }
  });
});

// ------------------------------------------------------------------Coupon----------------------------------------------------------------------

//Get apply coupon
router.get("/applyCoupon", verifyLogin, (req, res) => {
  let userId = req.session.user._id;
  couponHelpers.checkCoupon(req.query.coupon, userId).then((response) => {
    res.json(response);
  });
});

// ------------------------------------------------------------------offers----------------------------------------------------------------------

//Get offers
router.get("/offers", verifyLogin, async function (req, res, next) {
  let user = req.session.user;
  let cartCount = null;
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id);
  }
  let wishlistCount = null;
  if (req.session.user) {
    wishlistCount = await userHelpers.getWishlistCount(req.session.user._id);
  }
  let coupon = await couponHelpers.displayCoupon();
  let productOffer = await offerHelpers.GetAllProductOffers();
  let categoryOffer = await categoryOfferHelpers.displayCategoryOffer();
  res.render("user/offers", {
    coupon,
    user,
    productOffer,
    categoryOffer,
    cartCount,
    wishlistCount,
    indexFooter:true
  });
});

//Get referal
router.get("/wallet", verifyLogin, async function (req, res, next) {
  let user = req.session.user;
  let referId = user._id;
  let userId = user._id;
  let referLink = `http://localhost:3000/signup/${referId}`;
  let cartCount = null;
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id);
  }
  let wishlistCount = null;
  if (req.session.user) {
    wishlistCount = await userHelpers.getWishlistCount(req.session.user._id);
  }
  let userDetails = await userHelpers.getUserWallet(userId);
  let wallet = null;
  if (userDetails.wallet) {
    wallet = userDetails.wallet;
  }
  res.render("user/wallet", {
    user,
    cartCount,
    wishlistCount,
    wallet,
    referLink,
    indexFooter:true
  });
});


//search
router.get("/search", async (req, res) => {
  
  try {
      const product = await userHelpers.searchProducts(req.query.search);
      res.render("index", { product });
  } catch (err) {
      res.render("index", { product: [] });
  }
});

module.exports = router;

