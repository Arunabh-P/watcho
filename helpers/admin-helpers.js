var db=require('../config/connection')
var collection=require('../config/collections')
const bcrypt=require('bcrypt')
const { reject } = require('bcrypt/promises')
var objectId = require('mongodb').ObjectID;
const { ObjectId } = require('mongodb');
const { response } = require('express');
module.exports ={
    doLogin: (adminData) => {
        return new Promise(async (resolve, reject) => {
            let loginStatus = false
            let response = {}
            let admin = await db.get().collection(collection.ADMIN_COLLECTION).findOne({ email: adminData.email })
            if (admin) {
                bcrypt.compare(adminData.Password, admin.Password).then((status) => {
                    if (status) {
                        response.admin = admin
                        response.status = true
                        resolve(response)
                    } else {
                        resolve({ status: false })
                    }
                })

            } else {
                resolve({ status: false })
            }
        })
    },
   
}