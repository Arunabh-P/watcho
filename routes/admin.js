var express = require("express");
const { render, response } = require("../app");
const productHelpers = require("../helpers/product-helpers");
const banerHelpers = require("../helpers/baner-helpers");
var router = express.Router();
var adminHelpers = require("../helpers/admin-helpers");
var userHelpers = require("../helpers/user-helpers");
var couponHelpers = require("../helpers/coupon-helpers");
const res = require("express/lib/response");
const { reject } = require("bcrypt/promises");
const fs = require("fs");
const async = require("hbs/lib/async");
const offerHelpers = require("../helpers/offerHelpers");
const categoryOfferHelpers = require("../helpers/category-offer-helpers");

var categoryExistError = "";
var subcategoryExistError = "";
var subcategoryError = "";

// --------------------------------------------------verifyLogin--------------------------------------------------

const verifyLogin = (req, res, next) => {
  if (req.session.admin) {
    next();
  } else {
    res.redirect("/admin/login");
  }
};

// --------------------------------------------------Home Page--------------------------------------------------

// Get homepage(dashboard)
router.get("/", async function (req, res, next) {
  if (req.session.adminLoggedIn) {
    let pro = await productHelpers.getTotalPro();
    let sales = await productHelpers.getTotalSales();
    let status = await productHelpers.getTotalStatus();
    let totalSales = await productHelpers.getSalesTotal();
    let weeklyReport = await productHelpers.getweeklyreport();
    let totUsers = await productHelpers.getTotUsers();
    let totalDeliveredOrders = await productHelpers.getDeliveredOrderCount();
    let tot = totalSales.reduce(function (accumulator, item) {
      return accumulator + item.totalAmount;
    }, 0);
    let proCount = pro.length;
    res.render("admin/dashboard", {
      admin: true,
      pro,
      sales,
      data: weeklyReport,
      totalDeliveredOrders,
      status,
      tot,
      proCount,
      totUsers,
    });
  } else {
    res.redirect("/admin/login");
  }
});

// --------------------------------------------------category--------------------------------------------------

// Get category managment
router.get("/category-managment",verifyLogin, (req, res) => {
  productHelpers.getCategory().then((categoryData) => {
    res.render("admin/category-managment", {
      admin: true,
      categoryExistError,
      categoryData,
      subcategoryExistError,
    });
    categoryExistError = "";
    subcategoryExistError = "";
  });
});

// POST category
router.post("/add-category", (req, res) => {
  productHelpers.addCategory(req.body).then((response) => {
    if (response.exist) {
      categoryExistError = "This category is already exist";
      res.redirect("/admin/category-managment");
    } else {
      res.redirect("/admin/category-managment");
    }
  });
});

// Post Delete category
router.post("/delete-category", (req, res) => {
  productHelpers.deleteCategory(req.body).then((response) => {
    res.redirect("/admin/category-managment");
  });
});

// Get select-category-for-form
router.get("/select-category-for-form",verifyLogin, (req, res) => {
  productHelpers.getSubcategoriesForForm(req.query).then((response) => {
    res.send(response);
  });
});

// POST subcategory
router.post("/add-subcategory", (req, res) => {
  productHelpers.addSubcategory(req.body).then((response) => {
    if (response.exist) {
      subcategoryExistError = "subcategory already exist";
      res.redirect("/admin/category-managment");
    } else {
      res.redirect("/admin/category-managment");
    }
  });
});

// Get Delete subcategory
router.get("/delete-subcategory", verifyLogin, (req, res) => {
  productHelpers.deletesubCategory(req.query).then(() => {
    res.redirect("/admin/category-managment");
  });
});

// --------------------------------------------------product--------------------------------------------------

// Get view product
router.get("/view-products", verifyLogin,async (req, res)=> {
  let ProductOffer=await  offerHelpers.GetAllProductOffers()
  
  productHelpers.getAllProducts().then((products) => {
    
    res.render("admin/view-products", { admin: true, products,ProductOffer });
  });
});

// Get add product
router.get("/add-product", verifyLogin, function (req, res) {
  productHelpers.getCategory().then((categoryData) => {
    res.render("admin/add-product", {
      admin: true,
      categoryData,
      subcategoryError,
    });
  });
});

// Post add product
router.post("/add-product", (req, res) => {
  if (req.body.subcategory == 0) {
    subcategoryError = "This field is required";
    res.redirect("/admin/add-product");
  } else {
    productHelpers.addProduct(req.body).then((response) => {
      if (response.status) {
        id = response.id;
        if(req.files){
          req.files.image1?req.files.image1.mv('./public/images/product/' + id + 'image1.jpg'):null;
          req.files.image2?req.files.image2.mv('./public/images/product/' + id + 'image2.jpg'):null;
          req.files.image3?req.files.image3.mv('./public/images/product/' + id + 'image3.jpg'):null;
          req.files.image4?req.files.image5.mv('./public/images/product/' + id + 'image4.jpg'):null;
          req.files.image5?req.files.image5.mv('./public/images/product/' + id + 'image5.jpg'):null;
        }
        res.redirect("/admin/view-products");
      }
    });
  }
});

// Get delete product
router.get("/delete-product/:id", verifyLogin,(req, res) => {
  let proId = req.params.id;
  productHelpers.deleteProduct(proId).then((response) => {
    res.redirect("/admin/view-products");
  });
});

// Get edit product
router.get("/edit-product/:id",verifyLogin, function (req, res) {
  productHelpers.getProductDetails(req.params.id).then((product) => {
    productHelpers.getCategory().then((categoryData) => {
      res.render("admin/edit-product", { product, categoryData, admin: true });
    });
  });
});

//Post edit product
router.post("/edit-product/", (req, res) => {
  productid = req.body.id;
  productHelpers.updateProduct(productid,req.body).then((response) => {
    if (response.status) {
      id = req.body.id;

      if(req.files){
        req.files.image1?req.files.image1.mv('./public/images/product/' + id + 'image1.jpg'):null;
        req.files.image2?req.files.image2.mv('./public/images/product/' + id + 'image2.jpg'):null;
        req.files.image3?req.files.image3.mv('./public/images/product/' + id + 'image3.jpg'):null;
        req.files.image4?req.files.image5.mv('./public/images/product/' + id + 'image4.jpg'):null;
        req.files.image5?req.files.image6.mv('./public/images/product/' + id + 'image5.jpg'):null;
      }
      res.redirect("/admin/view-products");
    }  
  });
});

//Post get subcategory
router.post("/get-subcategory", async (req, res) => {
  let cat = req.body.category;
  productHelpers.getSubCategory(cat).then((subcatList) => {
    res.send(subcatList[0].subcategory);
  });
});


// ------------------------------------------------login,logout-----------------------------------------------

// Get login
router.get("/login", (req, res) => {
  if (req.session.adminLoggedIn) {
    res.redirect("/admin/dashboard");
  } else {
    res.render("admin/login", {
      loginErr: req.session.adminLoginErr,
      login: true,
      noheader: true,
    });
    req.session.adminLoginErr = false;
  }
});

// POST login
router.post("/login", (req, res) => {
  adminHelpers.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.adminLoggedIn = true;
      req.session.admin = response.admin;
      res.redirect("/admin/dashboard");
    } else {
      req.session.adminLoginErr = "Invalid Username or Password";
      res.redirect("/admin/login");
    }
  });
});

//logout
router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/admin/login");
});

// --------------------------------------------------users----------------------------------------------------

// Get users
router.get("/users", function (req, res, next) {
  if (req.session.adminLoggedIn) {
    userHelpers.getAllUsers().then((users) => {
      res.render("admin/users", {
        admin: true,
        users,
        name: req.session.admin.name,
      });
    });
  } else {
    res.redirect("/admin/login");
  }
});

//Get block user
router.get("/block/:id", (req, res) => {
  userHelpers.blockUser(req.params.id).then((response) => {
    res.redirect("/admin/users");
  });
});

//Get unblock user
router.get("/unblock/:id", (req, res) => {
  userHelpers.unBlockUser(req.params.id).then((response) => {
    res.redirect("/admin/users");
  });
});

// --------------------------------------------exclusive products---------------------------------------------

// Get add exclusive products
router.get("/add-exclusive-products",verifyLogin, function (req, res) {
  res.render("admin/add-exclusive-products", { admin: true });
});

// POST add exclusive products
router.post("/add-exclusive-products", (req, res) => {
  productHelpers.addExclusiveProduct(req.body, (id) => {
    let image = req.files.image;
    image.mv(
      "./public/exclusive-product-images/" + id + ".jpg",
      (err, done) => {
        if (!err) {
          res.render("admin/add-exclusive-products", { admin: true });
        } else {
          console.log(err);
        }
      }
    );
    res.render("admin/add-exclusive-products", { admin: true });
  });
});

// GET view exclusive products
router.get("/exclusive-products", verifyLogin,function (req, res) {
  productHelpers.getAllExclusiveProducts().then((ExclusiveProduct) => {
    res.render("admin/exclusive-products", { admin: true, ExclusiveProduct });
  });
});

// GET edit exclusive product
router.get("/edit-exclusive-product/:id", verifyLogin,async (req, res) => {
  let ExclusiveProduct = await productHelpers.getExclusiveProductDetails(
    req.params.id
  );
  res.render("admin/edit-exclusive-product", { ExclusiveProduct, admin: true });
});

// POST edit exclusive product
router.post("/edit-exclusive-product/:id", (req, res) => {
  let id = req.params.id;
  productHelpers.updateExclusiveProduct(req.params.id, req.body).then(() => {
    res.redirect("/admin/exclusive-products");
    if (req.files.image) {
      let image = req.files.image;
      image.mv("./public/exclusive-product-images/" + id + ".jpg");
    }
  });
});

// --------------------------------------------Shop For Men And Women--------------------------------------------- 

// GET add Shop For Men And Women
router.get("/add-men-women-baner",verifyLogin, function (req, res) {
  res.render("admin/add-men-women-baner", { admin: true });
});

// POST add Shop For Men And Women
router.post("/add-men-women-baner", (req, res) => {
  productHelpers.addMenWomenBaner(req.body, (id) => {
    let image = req.files.image;
    image.mv(
      "./public/for-men-women-images/" + id + ".jpg",
      (err, done) => {
        if (!err) {
          res.render("admin/add-men-women-baner", { admin: true });
        } else {
          console.log(err);
        }
      }
    );
    res.render("admin/add-men-women-baner", { admin: true });
  });
});

// GET view Shop For Men And Women
router.get("/men-women-baner",verifyLogin, function (req, res) {
  productHelpers.getAllMenWomenBaner().then((menWomenBaner) => {
    res.render("admin/men-women-baner", { admin: true, menWomenBaner });
  });
});

// GET edit Shop For Men And Women
router.get("/edit-men-women-baner/:id",verifyLogin, async (req, res) => {
  let menWomenBaner = await productHelpers.getAllMenWomenBanerDetails(
    req.params.id
  );
  res.render("admin/edit-men-women-baner", { menWomenBaner, admin: true });
});

// POST edit Shop For Men And Women
router.post("/edit-men-women-baner/:id", (req, res) => {
  let id = req.params.id;
  productHelpers.updategetAllMenWomenBaner(req.params.id, req.body).then(() => {
    res.redirect("/admin/men-women-baner");
    if (req.files.image) {
      let image = req.files.image;
      image.mv("./public/for-men-women-images/" + id + ".jpg");
    }
  });
});

// --------------------------------------------------baner----------------------------------------------------

// GET baner
router.get("/baners",verifyLogin, function (req, res) {
  banerHelpers.getallbaners().then((baner) => {
    res.render("admin/baners", { admin: true, baner });
  });
});

// GET add baner
router.get("/add-baner",verifyLogin, function (req, res) {
  res.render("admin/add-baner", { admin: true });
});

// POST add baner
router.post("/add-baner", (req, res) => {
  banerHelpers.addBaner(req.body, (id) => {
    let image = req.files.image;
    image.mv("./public/baner-images/" + id + ".jpg", (err, done) => {
      if (!err) {
        res.render("admin/baners", { admin: true });
      } else {
        console.log(err);
      }
    });
    res.render("admin/baners", { admin: true });
  });
});

// GET edit baner
router.get("/edit-baner/:id",verifyLogin, async (req, res) => {
  let Baner = await banerHelpers.getBanerDetails(req.params.id);
  res.render("admin/edit-baner", { Baner, admin: true });
});

// POST edit baner
router.post("/edit-baner/:id", (req, res) => {
  let id = req.params.id;
  banerHelpers.updateBaner(req.params.id, req.body).then(() => {
    res.redirect("/admin/baners");
    if (req.files.image) {
      let image = req.files.image;
      image.mv("./public/baner-images/" + id + ".jpg");
    }
  });
});

// ------------------------------------------------dashboard--------------------------------------------------

// GET dashboard
router.get("/dashboard",verifyLogin, async function (req, res, next) {
  if (req.session.adminLoggedIn) {
    let pro = await productHelpers.getTotalPro();
    let sales = await productHelpers.getTotalSales();
    let status = await productHelpers.getTotalStatus();
    let totalSales = await productHelpers.getSalesTotal();
    let weeklyReport = await productHelpers.getweeklyreport();
    let totUsers = await productHelpers.getTotUsers();
    let totalDeliveredOrders = await productHelpers.getDeliveredOrderCount();
    let tot = totalSales.reduce(function (accumulator, item) {
      return accumulator + item.totalAmount;
    }, 0);
    let chart = await productHelpers.getChartData();
    let proCount = pro.length;
    res.render("admin/dashboard", {
      admin: true,
      pro,
      sales,
      data: weeklyReport,
      totalDeliveredOrders,
      status,
      tot,
      proCount,
      totUsers,
      chart
    });
  } else {
    res.redirect("/admin/login");
  }
});

// --------------------------------------------------orders---------------------------------------------------

// Get orders
router.get("/orders",verifyLogin, (req, res) => {
  if (req.session.adminLoggedIn) {
    userHelpers.getAllOrders().then((allOrders) => {
      res.render("admin/orders", { admin: true, allOrders });
    });
  } else {
    res.redirect("/admin/login");
  }
});

// Get change status 
router.get("/status-change",verifyLogin, (req, res) => {
  let status = req.query.status;
  let id = req.query.id;
  userHelpers.changeStatus(status, id).then((data) => {
    res.redirect("/admin/orders");
  });
});

// ----------------------------------------------Product Offers------------------------------------------------

//Get add Product Offers
router.get('/add-product-offer/:id',verifyLogin,(req,res)=>{
  let ProdId=req.params.id
      res.render('admin/add-product-offer',{admin:true,ProdId})
  })
  router.post('/add-product-offer',(req,res)=>{
   
    offerHelpers.AddProductOffers(req.body).then((response)=>{
        res.redirect('/admin/view-products')
    })
   
})
//Get Product Offers
router.get('/admin-product-Offer',verifyLogin,async(req,res)=>{

  var ProductOffer=await  offerHelpers.GetAllProductOffers()
    res.render('admin/admin-product-Offer',{admin:true,ProductOffer})

})

//Post remove Product Offers
router.post('/RemoveProductOffer',(req,res)=>{
  OfferID=req.body.OfferID
  ProdID=req.body.ProdID
offerHelpers.RemoveProductOffer(OfferID,ProdID).then((response)=>{
    res.json({status:true})
})
})

// ----------------------------------------------Category Offer------------------------------------------------

//get Category Offer
router.get("/category-offer",verifyLogin, async (req, res) => {
  let categoryOffer=await categoryOfferHelpers.displayCategoryOffer();
  res.render("admin/category-offer", { admin: true ,categoryOffer});
});

//get add Category Offer
router.get("/add-category-offer",verifyLogin, function (req, res) {
  productHelpers.getCategory().then((allCategory) => {
  res.render("admin/add-category-offer", { admin: true , allCategory});
});
});

//Post add Category Offer
router.post("/add-category-offer", (req, res) => {
  categoryOfferHelpers.addCategoryOffer(req.body).then((response) => {
    res.redirect("/admin/category-offer");
  });
});



//get delete Category Offer
router.get("/delete-category-offer/",  (req, res) => {
  let categoryOfferId = req.query.id;
  categoryOfferHelpers.deleteCategoryOffer(categoryOfferId,req.query.cat).then((response) => {
    res.redirect("/admin/category-offer");
  });
});

// --------------------------------------------------Coupon----------------------------------------------------

//get coupon
router.get("/coupons",verifyLogin, async (req, res) => {
  let coupons = await couponHelpers.displayCoupon();
  res.render("admin/admin-coupon", { admin: true, coupons });
});

//get add coupon
router.get("/add-coupons",verifyLogin, function (req, res) {
  res.render("admin/add-coupons", { admin: true });
});

//post add coupon
router.post("/add-coupons", (req, res) => {
  couponHelpers.addCoupon(req.body).then((response) => {
    res.redirect("/admin/coupons");
  });
});

//delete coupon
router.get("/delete-coupon/:id", (req, res) => {
  let couponId = req.params.id;
  couponHelpers.deleteCoupon(couponId).then((response) => {
    res.redirect("/admin/coupons");
  });
});

// --------------------------------------------------Coupon----------------------------------------------------

// ------------------------------------------------Sales report------------------------------------------------

//Get Sales report
router.get("/salesreport", verifyLogin, async (req, res) => {
  let salesreport = await userHelpers.getsalesReport();
  res.render("admin/salesreport", { admin: true, salesreport });
});

//Post Sales report
router.post("/salesreport/report", async (req, res) => {
  let salesReport = await userHelpers.getSalesReport(
    req.body.from,
    req.body.to
  );
  res.json({ report: salesReport });
});
router.post("/salesreport/monthlyreport", async (req, res) => {
  let singleReport = await userHelpers.getNewSalesReport(req.body.type);
  res.json({ wmyreport: singleReport });
});
// ------------------------------------------------Sales report------------------------------------------------

module.exports = router;
