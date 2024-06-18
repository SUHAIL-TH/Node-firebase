const {admin}= require("../config/firebaseConfig")
const XLSX  =require("xlsx");
const moment=require("moment")
const firebbase = require("firebase-admin")



const comUserList=async(req,res)=>{//for getting the company user list
    try {
        let {limit,skip,company}=req.body
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
        if(company._id){
            let allcount=(await admin.firestore().collection("UserNode").where("access","==","App User").where("companyid","==",company._id).where("status","in",["1","2"]).get()).size
            let activecoutn=(await admin.firestore().collection("UserNode").where("access","==","App User").where("companyid","==",company._id).where("status","==","1").get()).size
            let inactivecount=(await admin.firestore().collection("UserNode").where("access","==","App User").where("companyid","==",company._id).where("status","==","2").get()).size
            let deletecount=(await admin.firestore().collection("UserNode").where("access","==","App User").where("companyid","==",company._id).where("status","==","0").get()).size
            let query= admin.firestore().collection("UserNode").where("access","==","App User").where("companyid","==",company._id).where("status","in",status)
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
        console.log(error);
        res.status(500).send({message:"somthing went wrong",status:false,})
    }
}


const comAddEditUser=async(req,res)=>{//for adding and editing the user to compgit pany  
    try {
        let actiontype=req.body.actiontype  
        delete req.body.actiontype
        let data=req.body
        data.access="App User"
        if(actiontype==="create"){
            let phonecheck=await admin.firestore().collection("UserNode").where("mobile","==",req.body.mobile).get()
            let result=phonecheck.docs.length
            let companyRef = admin.firestore().collection("UserNode").doc(data.companyid);
            let companySnapshot = await companyRef.get();
            let companyData = companySnapshot.data();
           if(companyData.activeuserscount<companyData.activeusers){
             if(result===0){
                console.log("here we have reached")
                await companyRef.update({
                    activeuserscount:firebbase.firestore.FieldValue.increment(1)
                })
                data.createAt=firebbase.firestore.FieldValue.serverTimestamp()
                admin.firestore().collection("UserNode").add(data)
                .then((dodRef)=>{
                    return dodRef.update({_id:dodRef.id})
                }).then((result)=>{
                    console.log(result);
                    res.send({message:"user added successfully",status:true})
                }).catch((error)=>{
                    console.log(error);
                    res.status(500).send({message:"somnthing went wrong",status:false})
                })
            }else{
                res.send({message:"Phone number already exsisted",status:false})
            }
           }else{
            res.send({message:"Max active user limit reached",status:false})
           }
           
        
        }else if(actiontype=="edit"){
            console.log(req.body)
            let phonecheck=await admin.firestore().collection("UserNode").where("mobile","==",req.body.mobile).where("_id","!=",data._id).get()
            let count=phonecheck.size
            console.log(count);
            if(count<=0){
            admin.firestore().collection("UserNode").doc(data._id).update(data).then((result)=>{
                res.status(200).send({message:'updated successfully',status:true})
                
            }).catch((error)=>{
                res.status(500).send({message:"somthing went wrong",status:false})
            })

            }else{
                res.send({message:"Phone number already exsisted",status:false})
            }

        }
    } catch (error) {
        console.log(error)
        res.status(500).send({message:"somthing went wrong",status:false})
    }
}


const comBulkUserUpload=async(req,res)=>{//for bulk uploading the user from company
    try {
          console.log("reached here");
        let file=req.file
        console.log(req.body)
        if(!file){
           return res.status(400).send({message:'no files is uploaded',status:false})
        }
        const workbook = XLSX.read(file.buffer, { type: "buffer"}); //this is for readintg the beffer data in our req.file
        const sheetName = workbook.SheetNames[0];
        const   worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        let docref=await admin.firestore().collection("UserNode").doc(req.body.companyid).get()
        let companyname=(await docref.data()).name
        let citylist=(await docref.data()).city
        let count=0
         let datasss=jsonData.map(async(data, index) => {
            data.access="App User"
            data.status="1"
            data.mobile=data.mobile.toString()
            data.company=companyname
            data.companyid=req.body.companyid
            data.createAt=firebbase.firestore.FieldValue.serverTimestamp()
            let userPhone=await admin.firestore().collection("UserNode").where("mobile","==",data.mobile).get()
            let phoneexsist=userPhone.docs.length
            if(phoneexsist>0){
                count++
            }else{
                if(citylist.includes(data.city.toLowerCase())){

                    try {
    
                        let result=await admin.firestore().collection("UserNode").add(data)
                        await admin.firestore().collection("UserNode").doc(result.id).update({ _id: result.id });
                        return { success: true, id: result.id };
                    } catch (error) {   
                        count++
                        return {success:false,error:error}
                    }
                }else{
                    count++
                }
            }

        });
        let result= await Promise.all(datasss)//this is used to await until all the user are added to the firebase store and then only want to sent the response back to front end
       
        res.send({message:"Upload completed",status:true,count:count})
    } catch (error) {
        console.log(error)
        res.status(500).send({message:"somthing went wrong",status:false})
    }
}

const addeditBatch=async(req,res)=>{
    try {
        let action=req.body.actiontype
        delete req.body.actiontype
        let data=req.body
        
        if(action==="create"){
            
            if(data.date==="custom"){
                const startdate = moment(data.datepicker[0]).startOf('day').format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
                const endate=moment(data.datepicker[`1`]).endOf('day').format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
        
                let bathref=await admin.firestore().collection('batch').add(data)
                let companyRef=await admin.firestore().collection("UserNode").doc(data.companyid)
                await companyRef.update({
                    batchcount:firebbase.firestore.FieldValue.increment(1)
                })
                let idofBatch=bathref.id
                await bathref.update({_id:idofBatch})

                let snapshot= await admin.firestore().collection("UserNode").where("access","==","App User").where("companyid","==",data.companyid).where("joindate", ">=", startdate).where("joindate","<=",endate).where("city","==",data.city).where("status","in",["1","2"]).get();
                let userDatas = [];
                snapshot.forEach(doc => {
                    userDatas.push(doc.data());
                });

                // console.log(userDatas)
                let userIds = userDatas.map(x => x._id);
                let batchPromises = userIds.map(async (id) => {
                    let userBatchSnapshot = await admin.firestore().collection("userbatch")
                    .where("userid", "==", id)
                    .get();
                    // .where("batchid", "==", idOfBatch)
                
                if (userBatchSnapshot.empty) {
                    let userBatchRef = await admin.firestore().collection("userbatch").add({userid: id, batchid: idofBatch,companyid:data.companyid});
                    await userBatchRef.update({_id: userBatchRef.id});
                }
    
                });

                // Wait for all batchPromises to resolve
                await Promise.all(batchPromises);

                res.send({message: "Batch created", status: true});
        
            }else{
                
                let today = moment().endOf('day').format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
                let filterDate = moment().subtract(data.date, "months").startOf('day').format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
        
                // Add a new batch and get its ID
                data.createAt=firebbase.firestore.FieldValue.serverTimestamp()//this is used to create the timestamp
                let batchRef = await admin.firestore().collection("batch").add(data);
                let companyRef=await admin.firestore().collection("UserNode").doc(data.companyid)
                await companyRef.update({
                    batchcount:firebbase.firestore.FieldValue.increment(1)
                })
                let idOfBatch = batchRef.id;
                await batchRef.update({_id: idOfBatch});

                 // Fetch user data based on the filter date
                let snapshot = await admin.firestore().collection("UserNode").where("access","==","App User").where("companyid","==",data.companyid).where("joindate", ">=", filterDate).where("city","==",data.city).where("status","in",["1","2"]).get();
                
                let userDatas = [];
                snapshot.forEach(doc => {
                    userDatas.push(doc.data());
                });

                // Map user IDs from the user data
                let userIds = userDatas.map(x => x._id);

                // Add userbatch documents for each user
                let batchPromises = userIds.map(async (id) => {
                    let userBatchSnapshot = await admin.firestore().collection("userbatch")
                    .where("userid", "==", id)
                    .get();
                    // .where("batchid", "==", idOfBatch)
                    
                if (userBatchSnapshot.empty) {
                    let userBatchRef = await admin.firestore().collection("userbatch").add({userid: id, batchid: idOfBatch,companyid:data.companyid});
                    await userBatchRef.update({_id: userBatchRef.id});
                }
                });
                // Wait for all batchPromises to resolve
                await Promise.all(batchPromises);

                res.send({message: "Batch created", status: true});
            }
        }else if(action==="update"){
            console.log(req.body)
            await admin.firestore().collection("batch").doc(data._id).update(data)
            res.status(200).send({message:"updated successfully",status:true})

        }
    } catch (error) {
        console.log(error)
        res.status(500).send({message:"somthing went wrong",status:false})
    }
}

// const company=async(req,res)=>{
//     try {
//         console.log(req.body)
        
//     } catch (error) {
//         console.log(error)
//         res.status(500).send({message:"somthing went wrong",status:false})
//     }
// }

const companyTrainers=async(req,res)=>{
    try {
        let skip = req.body.skip ?? 0;
        let limit = req.body.limit ?? 10;
        let search = req.body.search;
        let status = [];

        if (req.body.status === 3) {
            status = ["1", "2"];
        } else if (req.body.status === 1) {
            status = ["1"];
        } else if (req.body.status === 2) {
            status = ["2"];
        } else if (req.body.status === 0) {
            status = ["0"];
        }

        let allcount=(await admin.firestore().collection("UserNode").where("access","==","Trainer Login").where("companyid","==",req.body.company._id).where("status","in",["1","2"]).get()).size
        let activecoutn=(await admin.firestore().collection("UserNode").where("access","==","Trainer Login").where("companyid","==",req.body.company._id).where("status","==","1").get()).size
        let inactivecount=(await admin.firestore().collection("UserNode").where("access","==","Trainer Login").where("companyid","==",req.body.company._id).where("status","==","2").get()).size
        let deletecount=(await admin.firestore().collection("UserNode").where("access","==","Trainer Login").where("companyid","==",req.body.company._id).where("status","==","0").get()).size
        let trainerList = [];
        let docQuery = admin.firestore().collection("UserNode")
            .where("access", "==", "Trainer Login").where("companyid","==",req.body.company._id)
            .where("status", "in", status);

        if (search) {
            docQuery = docQuery.where("slugname", "==", search);
        }

        let snapshot = await docQuery.offset(skip).limit(limit).get();                                  //here the below code want to be used for the getting the order in des of addignt to database
         // let snapshot = await docQuery.offset(skip).limit(limit).orderBy("createAt",'desc').get();
        let size=snapshot.size
        snapshot.forEach((doc) => {
            trainerList.push(doc.data());
        });

        res.send({ message: "Trainers fetched successfully", status: true, data: trainerList,count:size ,all:allcount,active:activecoutn,inactive:inactivecount,delete:deletecount});
        
    } catch (error) {
        console.log(error)
        res.status(500).send({message:"somthing went wrong",status:false})
    }
}

const addeditCompany=async(req,res)=>{
    try {
      console.log(req.body)  
      let action=req.body.actiontype
      delete req.body.actiontype
      let data=req.body
      if(action==="create"){
          data.createAt=firebbase.firestore.FieldValue.serverTimestamp()
      let trainerRef= await admin.firestore().collection("UserNode").add(data)
      let docref=await admin.firestore().collection("UserNode").doc(trainerRef.id)
      await docref.update({_id:trainerRef.id})
      res.send({message:"Trainer added Successfully", status:true,})
      }else{
          let docref=await admin.firestore().collection("UserNode").doc(req.body._id)
          await docref.update(data)
          res.send({message:"Updated successfully", status:true})
      }
    } catch (error) {
        console.log(error)
        res.status(500).send({message:"somthing went wrong",status:false})
    }
}

module.exports={
    comUserList,
    comAddEditUser,
    comBulkUserUpload,
    addeditBatch,
    companyTrainers,
    addeditCompany

}