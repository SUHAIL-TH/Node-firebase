
const notificationSchema=require("../model/notification")
const {admin}=require("../config/firebaseConfig")
const practicedb=require("../model/practiceSchema")
const pronunciationlabSchema=require("../model/pronunciationlabSchema")
const { options } = require("../routes/flutter")



const notificationList=async(req,res)=>{
    try {

        const condition={status:1}
        if(req.body.search)[
            condition['$or']=[{title:{$regex:req.body.search,$options:'i'}}]
        ]
  
        let query=[]
       
        query.push({$match:condition})
        
        query.push({ $sort: { createdAt: -1 } });
        
   
        if (req.body.skip !== undefined && req.body.limit !== undefined) {
            query.push({ $skip: parseInt(req.body.skip,0) });
            query.push({ $limit: parseInt(req.body.limit, 10) });
        }
        
       
             const count = await notificationSchema.countDocuments({ status: { $in: [1, 2] } });

            let result = await notificationSchema.aggregate(query)
           
            res.status(200).send({message:"Fetched successfuly",status:true,data:result,count:count>0?count:0});
    } catch (error) {
        console.log(error)
        res.status(500).send({message:"somthing went wrong",status:"false"})
    }
}

const startPractice=async(req,res)=>{
    try {
        let data=req.body
        let uesrExsist=await practicedb.findOne({userid:data.userid,practicetype:req.body.practicetype})

        if(uesrExsist){
            if(["Pronunciation Lab Report", "Sentence Construction Lab Report", "Call Flow Practise Report", "Sound-wise Report"].includes(data.practicetype)){
            data.currentSessionStart=new Date()
            await practicedb.updateOne({userid:data.userid},{$set:{...data}})
            res.send({message:"pracitice session has started",status:true})
            }else{
                res.send({message:"Plesea give a valid practice type",status:false})
            }
            
        }else{  
            if(["Pronunciation Lab Report", "Sentence Construction Lab Report", "Call Flow Practise Report", "Sound-wise Report"].includes(data.practicetype)){
      
                data.currentSessionStart = new Date();
                let practiceData=new practicedb(data)
                let result=await practiceData.save()
                res.status(200).send({message:"created the session",status:true})
            }else{
                res.send({message:"Plesea give a valid practice type",status:false})
            }
          
          
        }


        
    } catch (error) {
        console.log(error)
        res.status(500).send({message:"somthing went wrong",status:false})
    }
}
const endPractice=async(req,res)=>{
    try {
        
   
        if(["Pronunciation Lab Report", "Sentence Construction Lab Report", "Call Flow Practise Report", "Sound-wise Report"].includes(req.body.practicetype)){
          let   data=req.body
            let uesrExsist=await practicedb.findOne({userid:data.userid,practicetype:req.body.practicetype})
            if (!uesrExsist) return res.status(404).send({message:'User not found'});
            if (!uesrExsist.currentSessionStart) return res.status(400).send({message:'No session started'})
            const sessionStart = new Date(uesrExsist.currentSessionStart);
            const sessionEnd = new Date();
            const duration = (sessionEnd - sessionStart) / 1000;
    
            data.totalPracticeTime = (uesrExsist.totalPracticeTime || 0) + duration;
            data.currentSessionStart = null; // Reset start time
    
            let result=await practicedb.updateOne({userid:data.userid},{$set:{...data}})
    
            res.status(200).send({message:"session has ended",status:true})
        }else{
            res.send({message:"Plesea give a valid practice type",status:false})
        }
  

       
    } catch (error) {
        // console.log(error.Error)
        console.log(error)
        res.status(500).send({message:"somthing went wrong ",status:false})
    }
}

const pronunciationLabReport=async(req,res)=>{
    try {
        console.log(req.body)
        const { userid, type ,word }=req.body
        console.log(word)
        let dataexsist=await pronunciationlabSchema.findOne({userid:userid})

        if(dataexsist){
            if(type==="practice"){
                let result = await pronunciationlabSchema.updateMany(
                    { _id: dataexsist._id },  
                    {
                        $inc: { practiceattempt: 1 }, 
                        $addToSet: { words: word }     
                    },
                    {
                        multi: true 
                    }
                );
            }else if(type==="listening"){
                let result = await pronunciationlabSchema.updateMany(
                    { _id: dataexsist._id }, 
                    {
                       
                        $addToSet: { words: word }  ,   
                        $inc: { listeningattempt: 1 }
                    },
                    {
                        multi: true 
                    }
                );

            }else if(type==="correct"){
                let result = await pronunciationlabSchema.updateMany(
                    { _id: dataexsist._id }, 
                    {
                        $inc: { correctattempt: 1 }, 
                        $addToSet: { words: word }     
                    },
                    {
                        multi: true 
                    }
                );
            }
            res.send({message:"updated successfully",status:true})

        }else{
           
            let userdata=(await admin.firestore().collection("UserNode").doc(userid).get()).data()
            let companydata=(await admin.firestore().collection("UserNode").doc(userdata.companyid).get()).data()
            let batchUserSnapshot=await admin.firestore().collection("userbatch").where("userid","==",userid).get()
            let batchUserData
            if (!batchUserSnapshot.empty) {
                batchUserData = batchUserSnapshot.docs[0].data();
            } else {
                console.log("No matching documents.");
                return res.send({message:"this user has no batch!! please add to a batch",status:false})
            }
            let batchdata=(await admin.firestore().collection("batch").doc(batchUserData.batchid).get()).data()

            let data
            if(type==="practice"){
                 data={
                    userid:userid,
                    userData:userdata,
                    username:userdata.username,
                    companyid:userdata.companyid,
                    companydata:companydata,
                    words:[word],
                    practiceattempt:1,
                    numberofword:1,
                    batchid:batchUserData.batchid,
                    batchdata:batchdata
                    
                }
            
            }else if(type==="listening"){
                data={
                    userid:userid,
                    userData:userdata,
                    companyid:userdata.companyid,
                    username:userdata.username,
                    companydata:companydata,
                    words:[word],
                    listeningattempt:1,
                    numberofword:1,
                    batchid:batchUserData.batchid,
                    batchdata:batchdata
                    
                }

            }else if(type==="correct"){
                data={
                    userid:userid,
                    userData:userdata,
                    companyid:userdata.companyid,
                    username:userdata.username,
                    companydata:companydata,
                    words:[word],
                    correctattempt:1,
                    numberofword:1,
                    batchid:batchUserData.batchid,
                    batchdata:batchdata
                    
                }
            }
            let pronunciationdata=new pronunciationlabSchema(data)
            let result=await pronunciationdata.save()
            // console.log(result)
            res.send({message:"pronunciation report stored successfully",status:true})
        }
        
    } catch (error) {
        console.log(error)
        res.status(500).send({message:"somthing went wrong",status:false})
    }
}

const pronunciationLabReportlist=async(req,res)=>{
    try {
        console.log(req.body)
        const skip=req.body.skip??10
        const limit=req.body.limit??0

        let query=[]
        if (req.body.search && req.body.search.trim() !== "") {
            query.push({
                $match: {
                    "userData.username": {
                        $regex: req.body.search.trim(),
                        $options: 'i'
                    }
                }
            });
        }
        if(req.body.city)
        // if(req.body.compa)
        query.push(
            {$addFields:{
                username:"$userData.username"}
            },
            {$addFields:{
                batchname:"$batchdata.name"}
            },
            {$addFields:{
                companyname:"$companydata.companyname"}
            },
            {
                $addFields: {
                  wordslength: { $size: "$words" }, // Calculate the size of the words array
                  successRatio: {
                    $cond: {
                      if: { $eq: ["$practiceattempt", 0] }, // Check if practiceattempt is 0
                      then: 0, // If practiceattempt is 0, set successRatio to 0
                      else: {$multiply:[{$divide: ["$correctattempt", "$practiceattempt"]},100]  } // Otherwise, calculate ratio
                    }
                  }
                }
              },
            {$project:{
                userid:1,
                username:1,
                batchname:1,
                companyname:1,
                correctattempt:1,
                practiceattempt:1,
                listeningattempt:1,
                wordslength:1,
                successRatio:1
            }}, 
            {$facet:{
                total: [
                    { $count: "count" }
                ],
                data: [
                    { $skip: parseInt(skip, 0) }, 
                    { $limit: parseInt(limit, 10) }
                ]
            }}
           

        )
        
        let result=await pronunciationlabSchema.aggregate(query)
        res.status(200).send({message:"pronuncation lab listing overall",data:result,status:true})
        
    } catch (error) {
        console.log(error)
        res.status(500).send({message:"somthing went wrong",status:false})
    }
}

module.exports={
    notificationList,
    startPractice,
    endPractice,
    pronunciationLabReport,
    pronunciationLabReportlist
}