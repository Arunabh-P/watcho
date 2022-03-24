var db = require("../config/connection");
var collection = require("../config/collections");
const bcrypt = require("bcrypt");
const async = require("hbs/lib/async");
const { reject } = require("bcrypt/promises");
var objectId = require("mongodb").ObjectID;
const { ObjectId } = require("mongodb");
const { response } = require("express");

module.exports = {
  displayCategoryOffer: async () => {
    let offers = await db
      .get()
      .collection(collection.CATEGORY_OFFER_COLLECTION)
      .find()
      .toArray();
    return offers;
  },

  //add category offer

  addCategoryOffer: (categoryOfferDetails) => {
    let categoryOffer = {
      category: categoryOfferDetails.category,
      offer: parseInt(categoryOfferDetails.offer),
      createdAt: new Date(),
      expiry: new Date(categoryOfferDetails.expiry),
    };
    return new Promise(async (resolve, reject) => {
      db.get()
        .collection(collection.CATEGORY_OFFER_COLLECTION)
        .insertOne(categoryOffer)
        .then(async (data) => {
          let category = categoryOfferDetails.category;
          let offer = categoryOfferDetails.offer;
          let Data = await db
            .get()
            .collection(collection.PRODUCT_COLLECTION)
            .find({ $and: [{ category: category }] })
            .toArray();
          await Data.map(async (product) => {
            let productPrice = product.price;
            let OfferPrice = productPrice - (productPrice * offer) / 100;
            OfferPrice = parseInt(OfferPrice.toFixed(2));
            let proId = product._id + "";
            await db
              .get()
              .collection(collection.PRODUCT_COLLECTION)
              .updateOne(
                {
                  _id: ObjectId(proId),
                },
                {
                  $set: {
                    price: OfferPrice,
                    categoryoffer: true,
                    OldPrice: productPrice,
                    bestoffer: parseInt(offer),
                    offerPercentage: parseInt(offer),
                  },
                }
              );
            resolve();
          });
        });
    });
  },
  //delete category offer
  deleteCategoryOffer: (offId, category) => {
    return new Promise(async (resolve, reject) => {
      let items = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .aggregate([
          {
            $match: { category: category, categoryoffer: true },
          },
        ])
        .toArray();
      await items.map(async (product) => {
        let productPrice = product.OldPrice;
        let proId = product._id + "";

        await db
          .get()
          .collection(collection.PRODUCT_COLLECTION)
          .updateOne(
            { _id: ObjectId(proId) },
            {
              $set: {
                price: productPrice,
                categoryoffer: false,
                offerPercentage: null,
                OldPrice: null,
              },
            }
          );
      });
      db.get()
        .collection(collection.CATEGORY_OFFER_COLLECTION)
        .deleteOne({ _id: ObjectId(offId) })
        .then(async () => {
          resolve();
        });
    });
  },
};
