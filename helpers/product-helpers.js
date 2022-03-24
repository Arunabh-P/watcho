var db = require("../config/connection");
var collection = require("../config/collections");
const { reject, promise } = require("bcrypt/promises");
var objectId = require("mongodb").ObjectID;
const { ObjectId } = require("mongodb");
const { response } = require("express");
const { status } = require("express/lib/response");
const async = require("hbs/lib/async");
module.exports = {
  addProduct: (product) => {
    product.price = parseFloat(product.price);
    product.quantity = parseInt(product.quantity);
    product.ProductOffer = false;

    product.offer = false;
    console.log(product.newPrice, "sasassssa");

    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .insertOne(product)
        .then((data) => {
          var id = data.insertedId;
          resolve({ status: true, id });
        });
    });
  },

  getAllProducts: () => {
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .find()
        .toArray();
      resolve(products);
    });
  },
  getAproduct: (prodId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .findOne({ _id: ObjectId(prodId) })
        .then((product) => {
          resolve(product);
        });
    });
  },

  getAllProductsByCat: (cat) => {
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .find({ category: cat })
        .toArray();
      resolve(products);
    });
  },
  getAllProductsBySubCat: (cat, subCat) => {
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .find({ subcategory: subCat, category: cat })
        .toArray();
      resolve(products);
    });
  },

  deleteProduct: (prodId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .deleteOne({ _id: ObjectId(prodId) })
        .then((response) => {
          resolve(response);
        });
    });
  },
  getProductDetails: (proId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .findOne({ _id: ObjectId(proId) })
        .then((product) => {
          resolve(product);
        });
    });
  },

  updateProduct: (proId, proDetails) => {
    proDetails.price = parseFloat(proDetails.price);
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .updateOne(
          { _id: ObjectId(proId) },
          {
            $set: {
              name: proDetails.name,
              category: proDetails.category,
              subcategory: proDetails.subcategory,
              price: proDetails.price,
              description: proDetails.description,
              offer: false,
              ProductOffer: false,
            },
          }
        )
        .then((response) => {
          resolve({ status: true });
        });
    });
  },

  addExclusiveProduct: (ExclusiveProduct, callback) => {
    db.get()
      .collection(collection.EXCLUSIVE_PRODUCT_COLLECTION)
      .insertOne(ExclusiveProduct)
      .then((data) => {
        callback(data.insertedId);
      });
  },
  getAllExclusiveProducts: () => {
    return new Promise(async (resolve, reject) => {
      let ExclusiveProduct = await db
        .get()
        .collection(collection.EXCLUSIVE_PRODUCT_COLLECTION)
        .find()
        .toArray();
      resolve(ExclusiveProduct);
    });
  },
  getExclusiveProductDetails: (ExProId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.EXCLUSIVE_PRODUCT_COLLECTION)
        .findOne({ _id: ObjectId(ExProId) })
        .then((ExclusiveProduct) => {
          resolve(ExclusiveProduct);
        });
    });
  },
  updateExclusiveProduct: (ExProId, ExProDetails) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.EXCLUSIVE_PRODUCT_COLLECTION)
        .updateOne(
          { _id: ObjectId(ExProId) },
          {
            $set: {
              name: ExProDetails.name,
            },
          }
        )
        .then((response) => {
          resolve();
        });
    });
  },

  //men-women baner
  addMenWomenBaner: (menWomenBaner, callback) => {
    db.get()
      .collection(collection.MEN_WOMEN_BANER_COLLECTION)
      .insertOne(menWomenBaner)
      .then((data) => {
        callback(data.insertedId);
      });
  },
  getAllMenWomenBaner: () => {
    return new Promise(async (resolve, reject) => {
      let menWomenBaner = await db
        .get()
        .collection(collection.MEN_WOMEN_BANER_COLLECTION)
        .find()
        .toArray();
      resolve(menWomenBaner);
    });
  },
  getAllMenWomenBanerDetails: (menWomenBanerId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.MEN_WOMEN_BANER_COLLECTION)
        .findOne({ _id: ObjectId(menWomenBanerId) })
        .then((menWomenBaner) => {
          resolve(menWomenBaner);
        });
    });
  },
  updategetAllMenWomenBaner: (menWomenBanerId, menWomenBanerDetails) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.MEN_WOMEN_BANER_COLLECTION)
        .updateOne(
          { _id: ObjectId(menWomenBanerId) },
          {
            $set: {
              discription: menWomenBanerDetails.discription,
            },
          }
        )
        .then((response) => {
          resolve();
        });
    });
  },
  //men-women baner

  // category

  addCategory: (data) => {
    return new Promise(async (resolve, reject) => {
      let response = {};

      let categoryCheck = await db
        .get()
        .collection(collection.CATEGORY_COLLECTION)
        .findOne({ category: data.category });

      if (categoryCheck) {
        response.exist = true;
        resolve(response);
      } else {
        await db
          .get()
          .collection(collection.CATEGORY_COLLECTION)
          .insertOne(data);
        response.exist = false;
        resolve(response);
      }
    });
  },

  getCategory: () => {
    return new Promise(async (resolve, reject) => {
      let allCategory = await db
        .get()
        .collection(collection.CATEGORY_COLLECTION)
        .find()
        .toArray();
      resolve(allCategory);
    });
  },

  getSubCategory: (cat) => {
    return new Promise(async (resolve, reject) => {
      let subCategory = await db
        .get()
        .collection(collection.CATEGORY_COLLECTION)
        .find({ category: cat })
        .toArray();
      resolve(subCategory);
    });
  },

  addSubcategory: (data) => {
    return new Promise(async (resolve, reject) => {
      let response = {};
      let subcategoryexist = await db
        .get()
        .collection(collection.CATEGORY_COLLECTION)
        .findOne({
          $and: [
            { category: data.categorySubcategory },
            { subcategory: data.subcategory },
          ],
        });

      if (subcategoryexist) {
        response.exist = true;
        resolve(response);
      } else {
        await db
          .get()
          .collection(collection.CATEGORY_COLLECTION)
          .updateOne(
            { category: data.categorySubcategory },
            { $push: { subcategory: data.subcategory } }
          );
        response.exist = false;
        resolve(response);
      }
    });
  },
  deleteCategory: (data) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.CATEGORY_COLLECTION)
        .deleteOne({ category: data.category })
        .then((result) => {
          resolve();
        });
    });
  },

  deletesubCategory: (data) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.CATEGORY_COLLECTION)
        .updateOne(
          { category: data.category },
          { $pull: { subcategory: data.subcategory } }
        )
        .then((data) => {
          resolve();
        });
    });
  },
  getSubcategoriesForForm: (data) => {
    return new Promise(async (resolve, reject) => {
      let result = await db
        .get()
        .collection(collection.CATEGORY_COLLECTION)
        .findOne({ category: data.category });
      resolve(result);
    });
  },

  //category

  //dashboard

  getTotalPro: () => {
    return new Promise(async (resolve, reject) => {
      let pro = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .aggregate([
          {
            $project: { Name: 1, _id: 0 },
          },
        ])
        .toArray();
      resolve(pro);
    });
  },

  getTotalSales: () => {
    return new Promise(async (resolve, reject) => {
      let cod = await db
        .get()
        .collection(collection.DELIVERED_COLLECTION)
        .aggregate([
          {
            $match: { paymentMethod: "COD" },
          },
          {
            $project: { count: { $size: { $ifNull: ["$products", []] } } },
          },
          {
            $group: { _id: "", total: { $sum: "$count" } },
          },
          {
            $set: { status: "COD" },
          },
        ])
        .toArray();

      let razor = await db
        .get()
        .collection(collection.DELIVERED_COLLECTION)
        .aggregate([
          {
            $match: { paymentMethod: "ONLINE" },
          },
          {
            $project: { count: { $size: { $ifNull: ["$products", []] } } },
          },
          {
            $group: { _id: "", total: { $sum: "$count" } },
          },
          {
            $set: { status: "ONLINE" },
          },
        ])
        .toArray();

      let paypal = await db
        .get()
        .collection(collection.DELIVERED_COLLECTION)
        .aggregate([
          {
            $match: { paymentMethod: "PAYPAL" },
          },
          {
            $project: { count: { $size: { $ifNull: ["$products", []] } } },
          },
          {
            $group: { _id: "", total: { $sum: "$count" } },
          },
          {
            $set: { status: "PAYPAL" },
          },
        ])
        .toArray();
      resolve([cod[0], razor[0], paypal[0]]);
    });
  },

  getTotalStatus: () => {
    return new Promise(async (resolve, reject) => {
      let Cstatus = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          { $match: { cancelStatus: true } },
          {
            $project: {
              count: { $size: { $ifNull: ["$products", []] } },
            },
          },
          {
            $group: {
              _id: "",
              total: { $sum: "$count" },
            },
          },
          { $set: { cancelStatus: true } },
        ])
        .toArray();

      let Astatus = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          { $match: { dispatchedStatus: true } },
          {
            $project: {
              count: { $size: { $ifNull: ["$products", []] } },
            },
          },
          {
            $group: {
              _id: "",
              total: { $sum: "$count" },
            },
          },
          { $set: { dispatchedStatus: true } },
        ])
        .toArray();

      let Sstatus = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          { $match: { proccessingStatus: true } },
          {
            $project: {
              count: { $size: { $ifNull: ["$products", []] } },
            },
          },
          {
            $group: {
              _id: "",
              total: { $sum: "$count" },
            },
          },
          { $set: { proccessingStatus: true } },
        ])
        .toArray();

      let Pstatus = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          { $match: { status: "placed" } },
          {
            $project: {
              count: { $size: { $ifNull: ["$products", []] } },
            },
          },
          {
            $group: {
              _id: "",
              total: { $sum: "$count" },
            },
          },
          { $set: { status: "placed" } },
        ])
        .toArray();

      let Dstatus = await db
        .get()
        .collection(collection.DELIVERED_COLLECTION)
        .aggregate([
          { $match: { deliveryStatus: true } },
          {
            $project: {
              count: { $size: { $ifNull: ["$products", []] } },
            },
          },
          {
            $group: {
              _id: "",
              total: { $sum: "$count" },
            },
          },
          { $set: { deliveryStatus: true } },
        ])
        .toArray();
      resolve([Astatus, Cstatus, Sstatus, Pstatus, Dstatus]);
    });
  },

  getSalesTotal: () => {
    return new Promise(async (resolve, reject) => {
      let totalProfit = await db
        .get()
        .collection(collection.DELIVERED_COLLECTION)
        .find()
        .toArray();
      resolve(totalProfit);
    });
  },
  getTotUsers: () => {
    return new Promise(async (resolve, reject) => {
      let users = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .find()
        .count();
      resolve(users);
    });
  },
  getDeliveredOrderCount: () => {
    return new Promise(async (resolve, reject) => {
      let orderDeliveredCount = await db
        .get()
        .collection(collection.DELIVERED_COLLECTION)
        .find()
        .count();
      resolve(orderDeliveredCount);
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

  getChartData: () => {
    return new Promise(async (resolve, reject) => {
      let data = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .aggregate([{ $group: { _id: "$category", count: { $sum: 1 } } }])
        .toArray();

      resolve(data);
    });
  },
};
