const { default: mongoose } = require("mongoose");
const notificationSchema=require("../model/notification")

const practicedb=require("../model/practiceSchema")



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
        console.log(req.body)
   
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

module.exports={
    notificationList,
    startPractice,
    endPractice
}