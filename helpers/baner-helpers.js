var db=require('../config/connection')
var collection=require('../config/collections')
const async = require('hbs/lib/async')
const { reject } = require('bcrypt/promises')
const { ObjectId } = require('mongodb')
const { response } = require('../app')
module.exports={
    addBaner:(baner,callback)=>{
        db.get().collection(collection.BANER_COLLECTION).insertOne(baner).then((data)=>{
            callback(data.insertedId)
        })

    },
    getallbaners:()=>{
        return new Promise(async(resolve,reject)=>{
            let baner=await db.get().collection(collection.BANER_COLLECTION).find().toArray()
            resolve(baner)
        })

    },
    getBanerDetails:(BanerId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.BANER_COLLECTION).findOne({_id:ObjectId(BanerId)}).then((baner)=>{
                resolve(baner)
            })
        })
    },
    updateBaner:(BanerId,BanerDetails)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.BANER_COLLECTION).updateOne({_id:ObjectId(BanerId)},{
                $set:{
                    name:BanerDetails.name
                }
            }).then((response)=>{
                resolve()
            })
        })
    }
    
}

