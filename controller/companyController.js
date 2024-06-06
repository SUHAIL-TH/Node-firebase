const {admin}= require("../config/firebaseConfig")
const XLSX  =require("xlsx");
const moment=require("moment")
const firebbase = require("firebase-admin")



const comUserList=async(req,res)=>{//for getting the list of  company users

    try {
        let {limit,skip,company}=req.body
        let userlist=[]
        console.log(req.body);
        if(company._id){
            let query= admin.firestore().collection("UserNode").where("companyid","==",company._id).where("status","in",["1","2"])
            if(req.body.search){
                query=query.where("username","==",req.body.search)
            }
            let snapshot= query.offset(skip).limit(limit).orderBy('createAt',"desc").get().then((snapshot)=>{
                snapshot.forEach((doc)=>{
                    userlist.push(doc.data())
                })
                console.log(userlist)
                res.status(200).send({message:"user List",status:true,data:userlist})
            }).catch((error)=>{
                console.log(error)
                res.status(500).send({message:"somthing went wrong",status:false})
            })
        }else{
            res.status(500).send({message:"somthing went wrong",statu:false})
        }
    } catch (error) {
        console.log(error);
        res.status(500).send({message:"somthing went wrong",status:false})
    }
}


const comAddEditUser=async(req,res)=>{//for adding and editing the company users
    try {
        let actiontype=req.body.actiontype  
        delete req.body.actiontype
        let data=req.body
        data.access="App User"
        if(actiontype==="create"){
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
        }else if(actiontype=="edit"){
            admin.firestore().collection("UserNode").doc(data._id).update(data).then((result)=>{
                res.status(200).send({message:'updated successfully',status:true})

            }).catch((error)=>{
                res.status(500).send({message:"somthing went wrong",status:false})
            })

        }
    } catch (error) {
        console.log(error)
        res.status(500).send({message:"somthing went wrong",status:false})
    }
}


const comBulkUserUpload=async(req,res)=>{//for bulk uploading the users from the companny
    
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
            console.log(data)
            if(citylist.includes(data.city.toLowerCase())){

                try {
                    let result=await admin.firestore().collection("UserNode").add(data)
                    return { success: true, id: result.id };
                } catch (error) {   
                    count++
                    return {success:false,error:error}
                }
            }else{
                count++
            }

        });
        let result= await Promise.all(datasss)//this is used to await until all the user are added to the firebase store and then only want to sent the response back to front end
       
        res.send({message:"Upload completed",status:true,count:count})
    } catch (error) {
        console.log(error)
        res.status(500).send({message:"somthing went wrong",status:false})
    }
}

module.exports={
    comUserList,
    comAddEditUser,
    comBulkUserUpload
}