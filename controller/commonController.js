const XLSX  =require("xlsx");
const moment=require("moment")
const {admin}=require("../config/firebaseConfig")
const firebbase = require("firebase-admin");
const { doc } = require("firebase/firestore");


const profileData=async(req,res)=>{
    try {
        let {id,type}=req.body
        let responseData
        let companycity
        let data=(await admin.firestore().collection("UserNode").doc(id).get()).data()
        if(type==="Trainer Login"){

             companycity=(await admin.firestore().collection("UserNode").doc(data.companyid).get()).data().city
            responseData={
               profildata:data,
               cityies:companycity
           }
        }else{
            console.log(data)
        }
        
        res.send({message:"profile data",status:true,data:data,cityies:companycity})
    } catch (error) {
        console.log(error)
        res.status(500).send({message:"somthing went wrong",status:false})
    }
}

const profileUpdate=async(req,res)=>{
    try {
        let {_id}=req.body
        console.log(req.body)
        let docdata=await admin.firestore().collection("UserNode").doc(_id)
        // console.log((await docdata.get()).data())
        await docdata.update(req.body)
        let responseData= (await admin.firestore().collection('UserNode').doc(_id).get()).data()
        // console.log(responseData)
        let accesss=responseData.access
        res.send({message:"updated successfully",status:true,data:responseData,access:accesss})
    } catch (error) {
        console.log(error)
        res.status(500).send({message:"somthing went wrong ",status:false})
    }
}

module.exports={
    profileData,
    profileUpdate
}