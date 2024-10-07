const XLSX  =require("xlsx");
const moment=require("moment")
const {admin}=require("../config/firebaseConfig")
const firebbase = require("firebase-admin");
const momenttz=require("moment-timezone")


const subscriptionendingCompanies=async(req,res)=>{
    try {
       
        let companysnapshot=await admin.firestore().collection("UserNode").where("status","==","1").get()
        let companydata=[]
        companysnapshot.forEach((doc)=>{
            companydata.push(doc.data())
        })
        console.log(companysnapshot.size)
        console.log(companydata)
    } catch (error) {
        console.log(error)
        res.status(500).send({message:"somthing went wrong",status:false})
    }
}


module.exports={
    subscriptionendingCompanies
}