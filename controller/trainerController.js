
const XLSX  =require("xlsx");
// const moment=require("moment")
const {admin}=require("../config/firebaseConfig")
const firebbase = require("firebase-admin");



const trainerUserList=async(req,res)=>{
    try {
   
        let {limit,skip,companyid}=req.body
        let userlist=[]
        let status=[]
        if(req.body.status===3){
            status=["1","2"]
        }else if(req.body.status===1){
            status=["1"]
        }else if(req.body.status===2){
            status=["2"]
        }else if(req.body.status===0){
            status=["0"]
        }
        if(companyid){
            let allcount=(await admin.firestore().collection("UserNode").where("access","==","App User").where("companyid","==",companyid).where("status","in",["1","2"]).get()).size
            let activecoutn=(await admin.firestore().collection("UserNode").where("access","==","App User").where("companyid","==",companyid).where("status","==","1").get()).size
            let inactivecount=(await admin.firestore().collection("UserNode").where("access","==","App User").where("companyid","==",companyid).where("status","==","2").get()).size
            let deletecount=(await admin.firestore().collection("UserNode").where("access","==","App User").where("companyid","==",companyid).where("status","==","0").get()).size
            // let totalcount=await admin.firestore().collection("Use")
            let query= admin.firestore().collection("UserNode").where("access","==","App User").where("companyid","==",companyid).where("status","in",status)

            if(req.body.search){
                query=query.where("username","==",req.body.search)
            }
            let size=(await query.get()).size
            let snapshot= query.offset(skip).limit(limit).orderBy('createAt',"desc").get().then((snapshot)=>{
                snapshot.forEach((doc)=>{
                    userlist.push(doc.data())
                })
                console.log(userlist)
                res.status(200).send({message:"user List",status:true,data:userlist,count:size,all:allcount,active:activecoutn,inactive:inactivecount,delete:deletecount})
            }).catch((error)=>{
                console.log(error)
                res.status(500).send({message:"somthing went wrong",status:false})
            })
        }else{
            res.status(500).send({message:"somthing went wrong",statu:false})
        }
    } catch (error) {
        console.log(error)
        res.status(500).send({message:"somthing went wrong",status:false})
    }
}
const trainercompanyData=async(req,res)=>{
    try {
        let {id}=req.body
        let companyData=(await admin.firestore().collection("UserNode").doc(id).get()).data()
        res.send({message:"companyData",data:companyData,status:true})
        
    } catch (error) {
        console.log(error)
        res.status(500).send({message:"somthing went wrong",status:false})
    }
}


module.exports={
    trainerUserList,
    trainercompanyData
}
