var db = require("../config/connection");
var collection = require("../config/collections");
const bcrypt = require("bcrypt");
const async = require("hbs/lib/async");
const { reject } = require("bcrypt/promises");
var objectId = require("mongodb").ObjectID;
const { ObjectId } = require("mongodb");
const { response } = require("express");

module.exports = {
  AddProductOffers: (offer) => {
    offer.ProdId = ObjectId(offer.ProdId);
    offer.discount = parseInt(offer.discount);
    var bodyProdId = offer.ProdId;
    return new Promise(async (resolve, reject) => {
      let ProdOffExixt = await db
        .get()
        .collection(collection.PRODUCT_OFFER_COLLECTION)
        .findOne({ ProdId: bodyProdId });
      if (ProdOffExixt) {
        resolve({ Exist: true });
      } else {
        await db
          .get()
          .collection(collection.PRODUCT_OFFER_COLLECTION)
          .insertOne(offer)
          .then(async (data) => {
            insertproOffer = await db
              .get()
              .collection(collection.PRODUCT_OFFER_COLLECTION)
              .findOne({ _id: data.insertedId });
            prodDis = insertproOffer.discount;
          });
        let ProdId = offer.ProdId;
        OfferProduct = await db
          .get()
          .collection(collection.PRODUCT_COLLECTION)
          .findOne({ _id: ObjectId(ProdId) });
        let comingPercentage = parseInt(prodDis);
        let activerpercentage = OfferProduct.categotyofferPercentage;
        let bestOff =
          comingPercentage < activerpercentage
            ? activerpercentage
            : comingPercentage;
        if (OfferProduct.categoryoffer) {
          let price = OfferProduct.OldPrice;
          let offerprice = price - (price * bestOff) / 100;
          offerprice = parseInt(offerprice.toFixed(0));
          db.get()
            .collection(collection.PRODUCT_COLLECTION)
            .updateOne(
              {
                _id: ObjectId(ProdId),
              },
              {
                $set: {
                  OldPrice: price,
                  price: offerprice,
                  offerPercentage: bestOff,
                  bestoffer: bestOff,
                  ProductOffer: true,
                },
              }
            );
        } else {
          let price = OfferProduct.price;
          let offerPrice = price - (price * comingPercentage) / 100;
          offerPrice = parseInt(offerPrice.toFixed(0));
          db.get()
            .collection(collection.PRODUCT_COLLECTION)
            .updateOne(
              {
                _id: ObjectId(ProdId),
              },
              {
                $set: {
                  OldPrice: price,
                  price: offerPrice,
                  offerPercentage: bestOff,
                  bestoffer: bestOff,
                  ProductOffer: true,
                },
              }
            );
        }
        resolve({ Exist: false });
      }
    });
  },

  GetAllProductOffers: () => {
    return new Promise(async (resolve, reject) => {
      var ProductOffer = await db
        .get()
        .collection(collection.PRODUCT_OFFER_COLLECTION)
        .aggregate([
          {
            $project: {
              _id: "$_id",
              ProdId: "$ProdId",
              discount: "$discount",
              offertype: "$offertype",
              validity: "$validity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "ProdId",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $unwind: "$product",
          },
          {
            $project: {
              _id: 1,
              ProdId: 1,
              discount: 1,
              offertype: 1,
              validity: 1,
              productname: "$product.name",
            },
          },
        ])
        .toArray();
      resolve(ProductOffer);
    });
  },
  RemoveProductOffer: (OfferID, ProdID) => {
    return new Promise(async (resolve, reject) => {
      let items = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .aggregate([
          {
            $match: { _id: ObjectId(ProdID) },
          },
        ])
        .toArray();
      let productPrice = items[0].OldPrice;
      await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .updateOne(
          {
            _id: ObjectId(ProdID),
          },
          {
            $set: {
              price: productPrice,
              categoryoffer: false,
              ProductOffer: false,
              bestoffer: null,
              offerPercentage: null,
              OldPrice: null,
            },
          }
        );
      db.get()
        .collection(collection.PRODUCT_OFFER_COLLECTION)
        .deleteOne({ _id: ObjectId(OfferID) })
        .then(() => {
          resolve();
        });
    });
  },
};
