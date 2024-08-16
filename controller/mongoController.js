const { database } = require("firebase-admin")
const notificationSchema= require("../model/notification")
const {admin}=require("../config/firebaseConfig")
const SmptSchema=require("../model/stmpt")
const emailTemplateSchema =require("../model/email_template")

const {pushNotification}=require("../push-notification/push-notification")


const createNotification=async(req,res)=>{
    try {

        let action=req.body.action
        delete req.body.action
        console.log(req.body)
        if(action==="create"){
            let result=new notificationSchema(req.body)
            let data=await result.save()
           
            pushNotification(req.body)
          
            let uerdata=(await admin.firestore().collection("UserNode").doc("vvQbINjlZNhvqlJ1yNCb").get()).data()
            const message = {
                notification: {
                  title: req.body.title || "Notification Title",
                  body: req.body.message || "Notification Body"
                },
                token: uerdata.fcmKey// The device token to which you want to send the notification
              };
                    await admin.messaging(message)

            res.status(200).send({message:"notification created successfully",status:true})

        }else{

            let result=await notificationSchema.updateOne({_id:req.body._id},{$set:{...req.body}})

            if(result.acknowledged){
                res.status(200).send({message:"updates Successfully",status:true})

            }else{
                res.status(500).send({message:"somthing went wrong",status:false})
            }
        }
       
    } catch (error) {
        console.log(error)
        res.status(500).send({message:"somthing went wrong",status:false})
    }
}



const notificationList=async(req,res)=>{
    try {
     
        let query=[]
        if (req.body.search) {
            query.push({ $match: { title: { $regex: req.body.search, $options: 'i' } } });
        }
        if (req.body.status != 0) {
           
            query.push({ $match: { status: req.body.status } });
        } else {
        
            query.push({ $match: { status: {$in:[1,2]}}});
        }
        
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
        res.status(500).send({message:"somthing went wrong ",status:false})
    }
}

const getNotificationData=async(req,res)=>{
    try {

        console.log(req.body)
        let data=await notificationSchema.findOne({_id:req.body.id})
      
        res.status(200).send({message:"fetched successfully",status:true,data:data})
        
    } catch (error) {
        console.log(error)
        res.status(500).send({message:"somthing went wrong",status:false})
    }
}

const deleteNotification=async(req,res)=>{
    try {

        let id=req.body.ids[0]

        let result=await notificationSchema.deleteOne({_id:id})
  
        res.status(200).send({message:"Deleted successfully",status:true})
        
    } catch (error) {
        console.log(error)
        res.status(500).send({message:"somthing went worng",status:false})
    }
}

const emailTemplate=async(req,res)=>{
    try {

        var condition = { status: { $ne: 0 } };
		if (req.body.search && req.body.search != '') {
			var searchs = req.body.search;
			condition['$or'] = [
				{ "name": { $regex: searchs + '.*', $options: 'si' } },
				{ "sender_email": { $regex: searchs + '.*', $options: 'si' } },
				{ "email_subject": { $regex: searchs + '.*', $options: 'si' } }
			];
		}
		
		var emailQuery = [{
			"$match": condition
		}, {
			$project: {
				name: 1,
				email_subject: 1,
				sender_email: 1,
				createdAt: 1,
				sort_name: { $toLower: '$name' },
				sort_email_subject: { $toLower: '$email_subject' },
				sort_sender_email: { $toLower: '$sender_email' }
			}
		}, {
			$project: {
				name: 1,
				document: "$$ROOT"
			}
		}, {
			$group: { "_id": null, "count": { "$sum": 1 }, "documentData": { $push: "$document" } }
		}];
		emailQuery.push({ $unwind: { path: "$documentData", preserveNullAndEmptyArrays: true } });
		var sorting = {};
		if (req.body.sort) {
			var sorter = 'documentData.' + req.body.sort.field;
			sorting[sorter] = req.body.sort.order;
			emailQuery.push({ $sort: sorting });
		} else {
			sorting["documentData.createdAt"] = 1;
			emailQuery.push({ $sort: sorting });
		}
		if ((req.body.limit && req.body.skip >= 0)) {
			emailQuery.push({ '$skip': parseInt(req.body.skip) }, { '$limit': parseInt(req.body.limit) });
		}
		emailQuery.push({ $group: { "_id": null, "count": { "$first": "$count" }, "documentData": { $push: "$documentData" } } });
		const docdata= await emailTemplateSchema.aggregate(emailQuery)
		if (!docdata) {
			res.send(err);
		} else {
			if (docdata.length != 0) {
				res.send([docdata[0].documentData, docdata[0].count]);
			} else {
				res.send([0, 0]);
			}
		}
    } catch (error) {
        console.log(error)
        res.status(500).send({message:"somthing went wrong",status:false})
    }
}

const editEmailTemplate=async(req,res)=>{
    try {
        console.log(req.body)
        let result=await emailTemplateSchema.findById(req.body.id)
        // console.log(result)
        res.send(result)
    } catch (error) {
        console.log(error)
        res.status(500).send({message:"somthing went wrong",status:false})
    }
}
const updateEmailTemplate=async(req,res)=>{
    try {
        // console.log(req.body)
        if(req.body._id){
            let result=await emailTemplateSchema.updateOne({_id:req.body._id},{$set:{...req.body}})
           
            res.status(200).send({message:"Updated Successfully",status:true})

        }

        
    } catch (error) {
        console.log(error)
        res.status(500).send({message:"somthing went wrong",status:false})
    }
}









//**********************************************************************smtp */
const smtpSave=async(req,res)=>{
    try {
        
        let settings=req.body
        console.log(settings)
        let data={
            settings:{
                smtp_host:settings.smtp_host,
                smtp_port:settings.smtp_port,
                smtp_password:settings.smtp_password,
                mode:settings.mode,
                smtp_username:settings.smtp_username
            }
        }
        let result=await SmptSchema.updateOne({alias:"smtp"},{$set:data},{upsert:true})
        res.send({message:"updated successfully",status:true})
           


        
    } catch (error) {
        
        console.log(error)
        res.status(500).send({message:"somthing went wrong",status:false})
    }
}
const smtpSetting=async(req,res)=>{
    try {
        let result=await SmptSchema.findOne({alias:"smtp"})
   
        res.send(result.settings)
        
    } catch (error) {
        console.log(error)
        res.status(500).send({message:"somthing went wrong",status:false})
    }
}
module.exports={
    createNotification,
    notificationList,
    getNotificationData,
    deleteNotification,
    smtpSave,
    smtpSetting,
    emailTemplate,
    editEmailTemplate,
    updateEmailTemplate
}

