const {admin}= require("../config/firebaseConfig")
const XLSX  =require("xlsx");
const moment=require("moment")
const firebbase = require("firebase-admin")



const comUserList=async(req,res)=>{//for getting the company user list
    try {
        console.log(req.body.company._id)
        let status = [];
        let reqdata=req.body.filter_action
        let reqstatus=reqdata.Status
        if (reqstatus === "3") {
            status = ["1", "2"];
        } else if (reqstatus === '1') {
            status = ["1"];
        } else if (reqstatus ==='2') {
            status = ["2"];
        } else if (reqstatus === '0') {
            status = ["0"];
        }else{
           
            status=["1","2"]
        }
      

        let query = admin.firestore().collection("UserNode")
        .where('access', '==', 'App User')
        .where('status', 'in', status)
        
        if(reqdata.Company){
            query=query.where("companyid","==",reqdata.Company);
        }else if(req.body.company._id){
            query=query.where("companyid","==",req.body.company._id);
        }
        if(reqdata.City){
            query=query.where("city","==",reqdata.City)
        }
        if(reqdata.Country){
            query=query.where("country","==",reqdata.Country)
        }
        if(reqdata.Role){
            query=query.where("role","==",reqdata.Role)
        }
        if(reqdata.Team){
            query=query.where("team","==",reqdata.Team)
        }
        if(reqdata.From_Date){
            reqdata.From_Date=moment(reqdata.From_Date).startOf('day').format('YYYY-MM-DDTHH:mm:ss.SSS[Z]')
            console.log(reqdata.From_Date)
            query=query.where("joindate", ">=", reqdata.From_Date)
        }
        
        if(reqdata.To_Date){
            console.log("hi  here")
            reqdata.To_Date=moment(reqdata.To_Date).endOf('day').format('YYYY-MM-DDTHH:mm:ss.SSS[Z]')
            console.log(reqdata.To_Date)
            query=query.where("joindate", "<=", reqdata.To_Date)
        }
        
        if(req.body.search){
            let searchTerm=req.body.search.toLowerCase()
            query = query.where("username", ">=", searchTerm)
                         .where("username", "<=", searchTerm + "\uf8ff");
        }
        let count=(await query.get()).size
        const snapshot = await query.offset(req.body.skip).limit(req.body.limit).orderBy("createAt","desc").get();
            
            let data = [];
            snapshot.forEach(doc => {
                data.push({_id: doc.id, ...doc.data()});
            });
           return  res.status(200).send({ data,count, message: "Users fetched successfully",status: true, });
        // let {limit,skip,company}=req.body
        // let userlist=[]
        // let status=[]
        // if(req.body.status===3){
        //     status=["1","2"]
        // }else if(req.body.status===1){
        //     status=["1"]
        // }else if(req.body.status===2){
        //     status=["2"]
        // }else if(req.body.status===0){
        //     status=["0"]
        // }
        // if(company._id){
        //     let allcount=(await admin.firestore().collection("UserNode").where("access","==","App User").where("companyid","==",company._id).where("status","in",["1","2"]).get()).size
        //     let activecoutn=(await admin.firestore().collection("UserNode").where("access","==","App User").where("companyid","==",company._id).where("status","==","1").get()).size
        //     let inactivecount=(await admin.firestore().collection("UserNode").where("access","==","App User").where("companyid","==",company._id).where("status","==","2").get()).size
        //     let deletecount=(await admin.firestore().collection("UserNode").where("access","==","App User").where("companyid","==",company._id).where("status","==","0").get()).size
        //     let query= admin.firestore().collection("UserNode").where("access","==","App User").where("companyid","==",company._id).where("status","in",status)
        //     if(req.body.search){
        //         let searchTerm=req.body.search.toLowerCase()
        //         query = query.where("slugname", ">=", searchTerm)
        //                              .where("slugname", "<=", searchTerm + "\uf8ff");
        //         // query=query.where("username","==",req.body.search)
        //     }
        //     let size=(await query.get()).size
        //     let snapshot= query.offset(skip).limit(limit).orderBy('createAt',"desc").get().then((snapshot)=>{
        //         snapshot.forEach((doc)=>{
        //             userlist.push(doc.data())
        //         })
        //         console.log(userlist)
        //         res.status(200).send({message:"user List",status:true,data:userlist,count:size,all:allcount,active:activecoutn,inactive:inactivecount,delete:deletecount})
        //     }).catch((error)=>{
        //         console.log(error)
        //         res.status(500).send({message:"somthing went wrong",status:false})
        //     })
        // }else{
        //     res.status(500).send({message:"somthing went wrong",statu:false})
        // }
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
            // console.log(req.body)
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


const comBulkUserUpload=async(req,res)=>{

    try {
     
        let skippeddocumets=[]
       
        let file=req.file
        if(!file){
           return res.status(400).send({message:'no files is uploaded',status:false})
        }
        
        const workbook = XLSX.read(file.buffer, { type: "buffer"}); //this is for readintg the beffer data in our req.file
        const sheetName = workbook.SheetNames[0];
        const   worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        // const header = Object.keys(jsonData[0] || {});
        const headers = [];
        const range = XLSX.utils.decode_range(worksheet['!ref']);
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const address = XLSX.utils.encode_cell({ r: 0, c: C });
            if (!worksheet[address]) continue; // Skip empty cells
            headers.push(worksheet[address].v);
        }
        if(jsonData.length===0){
            return res.send({message:"Xcel sheet has no data",stats:false})
        }
        const requiredFields = ['username', 'email', 'mobile',"city","country","joindate","team","role"];
       
       
        
        const missingFields = requiredFields.filter(field => !headers.includes(field));
        
        if (missingFields.length > 0) {
            // console.log(`The sheet is missing the following required fields : ${missingFields.join(', ')}`);
          return  res.send({message:`missing fields like :${missingFields.join(", ")}`,status:false})
           
        }

        let docref=await admin.firestore().collection("UserNode").doc(req.body.companyid).get()
        let companydata=await docref.data()
        const currentTotalUsers = companydata.totalusers||0;
     
        let rolelist=companydata.role
        let teamlist=companydata.team
        let count=0
        let insertcount=0
         let datasss=jsonData.map(async(data, index) => {
            if (!data.email || !data.mobile || !data.team || !data.role || !data.country || !data.city || !data.username || !req.body.joindate) {
                count++;
                skippeddocumets.push({ name: data.username?data.username:data.email, reason: "Missing required fields" });
                return null; // Skip document
            }
            console.log(data.joindate)
            function excelDateToJSDate(serial) {
                // Excel's epoch starts at 1899-12-30
                var excelEpoch = new Date(Date.UTC(1899, 11, 30)); // Use UTC to avoid timezone issues
                var daysOffset = serial - 1; // Subtract 1 to adjust for the leap year bug in Excel
            
                // Calculate the date by adding the number of days to the epoch
                var jsDate = new Date(excelEpoch.getTime() + daysOffset * 86400000); // 86400000 ms in a day
            
                // Add one more day (86400000 milliseconds) to the resulting date
                jsDate = new Date(jsDate.getTime() + 86400000);
            
                return jsDate;
            }
            
            
            let excelDate = data.joindate; // Example Excel date serial number
            data.joindate = excelDateToJSDate(excelDate);
            data.joindate=data.joindate.toString()
            data.status="1"
            data.access="App User"
            // data.joindate=req.body.joindate
            data.email=data.email
            data.mobile=data.mobile.toString()
            data.role=data.role.toLowerCase()
            data.team=data.team.toLowerCase()
            data.company=companydata.name
            data.city=data.city.toLowerCase()
            data.country=data.country.toLowerCase()
            data.companyid=req.body.companyid
            console.log(data.joindate)
            
            data.createAt=firebbase.firestore.FieldValue.serverTimestamp()
           
            let userPhone=await admin.firestore().collection("UserNode").where("mobile","==",data.mobile).get()
            let emailexsist=(await admin.firestore().collection("UserNode").where("email","==",data.email).get()).size
            let phoneexsist=userPhone.docs.length
            if(data.hasOwnProperty("__EMPTY")){
                
                count++
            }else{
                const emailToValidate =data.enail;
                const emailRegexp = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

                let status=emailRegexp.test(emailToValidate)
                if(emailexsist>0||status){
                    if(emailexsist>0){

                        count++
                        skippeddocumets.push({name:data.username,reason:"email already exsisted"})
                    }else{
                        count++
                        skippeddocumets.push({name:data.username,reason:"Invalid email id"})

                    }
                    
                }else{
                    if(phoneexsist>0 ||data.mobile.length===10){
                        count++
                        skippeddocumets.push({name:data.username,reason:"phone number has skipped due to duplicate or invalid"})
                       
                    }else{
                        if(rolelist.includes(data.role)){
                            if(teamlist.includes(data.team)){
                            
                                let countryexsits=companydata.countryCity.filter((x)=>x.country===data.country)
                                if(countryexsits.length>0){
                                    let cityexsits=countryexsits[0].city.includes(data.city)
                                    if(cityexsits){
                                        let result=await admin.firestore().collection("UserNode").add(data)
                                        await admin.firestore().collection("UserNode").doc(result.id).update({ _id: result.id });
                                        insertcount++
                                        return { success: true, id: result.id };
                                    }else{
                                        count++
                                        skippeddocumets.push({name:data.username,reason:"ciyt not exsisted"})
                                    }
                                }else{
                                    count++
                                    skippeddocumets.push({name:data.username,reason:"country not exsisted"})
                                }

                            }else{
                                count++
                                skippeddocumets.push({name:data.username,reason:"team is not exsisted"})
                            }

                        }else{
                            count++
                            skippeddocumets.push({name:data.username,reason:"role is not exsisted"})
                            
                        }
                      
                    }

                }
             
            }
            
            
           

        });
        let result= await Promise.all(datasss)//this is used to await until all the user are added to the firebase store and then only want to sent the response back to front end
        console.log(skippeddocumets)
        let total=currentTotalUsers+insertcount
        await admin.firestore().collection("UserNode").doc(req.body.companyid).update({
            totalusers: total
        });
        res.send({message:"Upload completed",status:true,count:count,skippeddocs:skippeddocumets})

        
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
                let companyShort = data.company.slice(0, 2).toUpperCase();   
                let cityShort = data.city.slice(0, 2).toUpperCase();  
                let teamShort = data.team.map(item => item.slice(0, 2)).join('').toUpperCase();  
                let roleShort = data.role.map(item => item.slice(0, 2)).join('').toUpperCase(); 
                let todaydata = new Date().toISOString().slice(5, 10).replace(/-/g, '-');


                let shortname = `${companyShort}${cityShort}${teamShort}${roleShort}_${todaydata}`;
                data.shortname=shortname
                data.createAt=firebbase.firestore.FieldValue.serverTimestamp()//this is used to create the timestamp
        
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
                let userCount=userData.length
                await bathref.update({_id: idOfBatch,usercount:userCount});

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

                await Promise.all(batchPromises);  // Wait for all batchPromises to resolve
                res.send({message: "Batch created", status: true});
        
            }else{
                
                let today = moment().endOf('day').format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
                let filterDate = moment().subtract(data.date, "months").startOf('day').format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
                let companyShort = data.company.slice(0, 2).toUpperCase();   
                let cityShort = data.city.slice(0, 2).toUpperCase();  
                let teamShort = data.team.map(item => item.slice(0, 2)).join('').toUpperCase();  
                let roleShort = data.role.map(item => item.slice(0, 2)).join('').toUpperCase(); 
                let todaydata = new Date().toISOString().slice(5, 10).replace(/-/g, '-');


                let shortname = `${companyShort}${cityShort}${teamShort}${roleShort}_${todaydata}`;
                data.shortname=shortname
        
                // Add a new batch and get its ID
                data.createAt=firebbase.firestore.FieldValue.serverTimestamp()   //this is used to create the timestamp
                let batchRef = await admin.firestore().collection("batch").add(data);
                let companyRef=await admin.firestore().collection("UserNode").doc(data.companyid)
                await companyRef.update({
                    batchcount:firebbase.firestore.FieldValue.increment(1)
                })
                let idOfBatch = batchRef.id;
                // await batchRef.update({_id: idOfBatch});

                 // Fetch user data based on the filter date
                let snapshot = await admin.firestore().collection("UserNode").where("access","==","App User")
                            .where("companyid","==",data.companyid).where("joindate", ">=", filterDate)
                            .where("city","==",data.city).where("status","in",["1","2"]).get();
                
                let userDatas = [];
                snapshot.forEach(doc => {
                    userDatas.push(doc.data());
                });
                let userCount=userData.length
                await bathref.update({_id: idOfBatch,usercount:userCount});
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
        console.log(req.body)
        let skip = req.body.skip ?? 0;
        let limit = req.body.limit ?? 10;
        let search = req.body.search;
        let status = [];

        let reqdata=req.body.filter_action
        let reqstatus=reqdata.Status
        if (reqstatus === "3") {
            status = ["1", "2"];
        } else if (reqstatus === '1') {
            status = ["1"];
        } else if (reqstatus ==='2') {
            status = ["2"];
        } else if (reqstatus === '0') {
            status = ["0"];
        }else{
           
            status=["1","2"]
        }

        // let allcount=(await admin.firestore().collection("UserNode").where("access","==","Trainer Login").where("status","in",["1","2"]).get()).size
        // let size=(await admin.firestore().collection("UserNode").where("access","==","Trainer Login").where("status","in",status).get()).size //for showing the pagination count for total documents
        // let activecoutn=(await admin.firestore().collection("UserNode").where("access","==","Trainer Login").where("status","==","1").get()).size
        // let inactivecount=(await admin.firestore().collection("UserNode").where("access","==","Trainer Login").where("status","==","2").get()).size
        // let deletecount=(await admin.firestore().collection("UserNode").where("access","==","Trainer Login").where("status","==","0").get()).size
        let trainerList = [];
        let docQuery = admin.firestore().collection("UserNode")
            .where("access", "==", "Trainer Login")
            .where("status", "in", status);

        if (search) {
            let searchTerm=search.toLowerCase()
            docQuery = docQuery.where("slugname", ">=", searchTerm)
                                     .where("slugname", "<=", searchTerm + "\uf8ff");
        }
        if(reqdata.Company){
            docQuery=docQuery.where("companyid","==",reqdata.Company);
        }else if(req.body.company._id){
            docQuery=docQuery.where("companyid","==",req.body.company._id);
        }
        if(reqdata.Country){
            docQuery=docQuery.where("country","==",reqdata.Country)
        }
        if(reqdata.City){
            docQuery=docQuery.where("city","==",reqdata.City)
        }
        
        let size=(await docQuery.get()).size

        let snapshot = await docQuery.offset(skip).limit(limit).orderBy("createAt",'desc').get();                                  //here the below code want to be used for the getting the order in des of addignt to database
         // let snapshot = await docQuery.offset(skip).limit(limit).orderBy("createAt",'desc').get();
      
        snapshot.forEach((doc) => {
            trainerList.push(doc.data());
        });

        

        res.send({ message: "Trainers fetched successfully", status: true, data: trainerList,count:size });
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