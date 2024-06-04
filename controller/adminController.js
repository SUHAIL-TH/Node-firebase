const admin = require("firebase-admin")
// const firebase=require('firebase')
const serviceAccount = require('../serviceAccountKey.json');
const XLSX  =require("xlsx");
const { request } = require("../routes/admin");
const moment=require("moment")



admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})

//**************************************************************************************** Admin ******************************************************************************************************** */

const roleCheck = async (req, res) => { // used to check the role of the login admin
    try {
        let { email } = req.body
        const usersRef = admin.firestore().collection('UserNode');
        const querySnapshot = await usersRef.where('email', '==', email).get();

        if (querySnapshot.empty) {
            return res.send({ message: 'Invalid email', status: false })
        }
        let userData = [];
        querySnapshot.forEach(doc => {
            userData.push(doc.data());
        });
        res.send({ message: "successfull", data: userData[0], status: true })
    } catch (error) {
        console.log(error)
        res.status(500).send({ message: "somthing went wrong", status: false })
    }
}


const postLogin = async (req, res) => { // for login implemting login currenly not in use
    let email = req.body.email
    let password = req.body.password
    console.log(email, password);
    try {
        const userRecord = await admin.auth().getUserByEmail(email)
        console.log(userRecord);
    } catch (error) {
        console.log(error)
        res.status(500).send({ message: "Somthing Went wrong", status: false })
    }
}


const subAdminslist = async (req, res) => {//for getting the subadminlist
    try {
        let data = [];
        const collectionRef = admin.firestore().collection('subAdmins');
        let query = collectionRef.where("access", "==", "subAdmin");

        if (req.body.search) {
            query = query.where("name", "==", req.body.search);
        }

        const snapshotCount = await query.get();
        const count = snapshotCount.size;

        query = query.offset(req.body.skip).limit(req.body.limit).orderBy('createAt','desc');

        // Execute the query
        const snapshot = await query.get();
        snapshot.forEach(doc => {
            data.push(doc.data());
        });

        res.send({ message: "Sub admin list", data: data, status: true, count: count });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send({ message: "Something went wrong", status: false });
    }
};


const createUpdateSubAdmin = async(req, res) => {// for to add/update subadmin to the firestore
    try {
        const actiontype = req.body.actiontype; 
        console.log(req.body);
        delete req.body.actiontype;
        let data =req.body
     
        
         if(actiontype==="create"){
            data.createAt=admin.firestore.FieldValue.serverTimestamp()
            admin.firestore().collection('subAdmins').add(data)
            .then((result) => {

                res.status(200).send({ message: "Sub admin Addes successfully", status: true })
            }).catch((error) => {
                console.log(error);
                res.status(500).send({ message: "Error in while adding data", status: false })
            })
         }else if(actiontype==="update"){
            const snapshot = await admin.firestore().collection("subAdmins").where("_id", "==", data._id).get();
            if (!snapshot.empty) {
                const updatePromises = snapshot.docs.map(doc =>
                    admin.firestore().collection("subAdmins").doc(doc.id).update(data)
                );
                await Promise.all(updatePromises);
                res.status(200).send({ message: "Sub admin updated successfully", status: true });
            } else {
                res.status(400).send({ message: "No sub admin data is not founded", status: false });
            }
        } 
    } catch (error) {
        console.log(error);
        res.status(500).send({ message: "somthing went wrong", status: false })
    }
}


const getSubadmin = async (req, res) => {// for getting the subadmin details
    try {
        let id = req.body.data
        let data = await admin.firestore().collection("subAdmins").where("_id", "==", id).get()
        const doc = data.docs[0];
        const docData = doc.data();
        res.status(200).send({message:"sub admin data",status:true,data:docData})
        // .then(snapshot=>{
        //     snapshot.forEach((doc)=>{
        //         console.log(doc)
        //         res.send({message:"Sub admin details",status:true,data:doc.data()})
        //     })
        // }).catch((error)=>{
        //     res.status(500).send({message:'somthing went wrong',status:false})
        // })
    } catch (error) {
        console.log(error)
        res.status(500).send({ message: "somthing went wrong", status: false })
    }
}


const deleteSubAdmin = async (req,res)=>{ // for deleting the subadmin
    let id = req.body.ids[0];
    let query = await admin.firestore().collection('subAdmins').where("_id", "==", id);

    try {
        const snapshot = await query.get();
        if (!snapshot.empty) {
            await Promise.all(snapshot.docs.map(doc => doc.ref.delete()));
            // console.log("deleted");
            res.send({message: "Subadmin deleted successfully", status: true});
        } else {
           
            res.send({message: "No subadmin found with the given ID", status: false});
        }
    } catch (error) {
        console.log(error);
        res.status(500).send({message: "Error deleting subadmin", status: false});
    }
}


const companyList = async (req,res)=>{// for getting the company list
    try {
        let data=[]
        let collectionRef=admin.firestore().collection("companies").where('access',"==","company").where("status","in",["1","2"])
        if(req.body.search){
            let search=req.body.search.toLowerCase()
            collectionRef=collectionRef.where("slugname","==",search)
        }
        let snapshotCount=await collectionRef.get()
        let count=snapshotCount.size; 
        collectionRef=collectionRef.offset(req.body.skip).limit(req.body.limit) //here want to add orderBy also to sort the document
        collectionRef.get().then((snapshot)=>{
            snapshot.forEach((doc)=>{
                let insertdata=doc.data()
                insertdata._id=doc.id
                data.push(insertdata)
            })
            res.status(200).send({message:"companies list ",status:true,data:data,count:count})
        }).catch((error)=>{
            console.log(error)
            res.status(500).send({message:"somthing went wrong",status:false})
        })


    } catch (error) {
        console.log(error)
        res.status(500).send({message:"somthing went wrong",status:false})
    }
}


const addeditcompany = async (req, res) => { //for adding and editing companies
    try {
        let type=req.body.actiontype
        delete req.body.actiontype
        let data = req.body;
        if(type==="create"){
            data.createAt=admin.firestore.FieldValue.serverTimestamp()
            const docRef = await admin.firestore().collection("companies").add(data)
            // .then((result)=>{
            //     if(result){
            //         res.status(200).send({ message: "Company added", status: true, });
            //     }
            // }).catch((error)=>{
            //     console.log(error)
            //     res.status(500).send({message:"somthing went wrong",status:false})
            // })
            const id = docRef.id;                                                        //in this way we can add the id manually inside the collection
            await admin.firestore().collection("companies").doc(id).set({ ...data, _id: id }, { merge: true }).then((result)=>{
                 res.status(200).send({ message: "Company added", status: true, });
            })
        }else if(type==="update"){
            console.log(req.body)
            let data=req.body
            let result=await admin.firestore().collection("companies").doc(data._id).update(data).then((result)=>{
                console.log(res)
                res.send({message:"Update successully",status:true})
            }).catch((error)=>{
                console.log(error)
                res.status(500).send({message:"somthing went wrong",status:false})
            })
           
        }
       
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Something went wrong", status: false });
    }
};


const company_subadmin_Delete = async (req,res)=>{//for deleting the company
    try {
        let id=req.body.ids[0]
        if(id){
            let docRef = admin.firestore().collection("companies").doc(id).update({status:"0"})
            // await docRef.delete()
            res.status(200).send({message:"company deleted",status:true})   

        }else{
            res.status(500).send({message:"invalide id",status:false})
        }
        
    } catch (error) {
        console.log(error)
        res.status(500).send({message:"somthing went wrong",status:false})
    }
}


const getCompany = async (req,res)=>{//for getting the companydetails one at a time
    try {
        let id=req.body.data
        let docRef= await admin.firestore().collection("companies").doc(id).get()
        let data=docRef.data()
        data._id=docRef.id
        res.status(200).send({message:"company details",data:data,status:true})
        
    } catch (error) {
        console.log(error)
        res.status(500).send({message:'somthing went wrong',status:false})
    }
}


const companyStatus = async (req,res)=>{//for upating the company status
    try {
        let {id,status}=req.body
        data={
            status:status
        }
        await admin.firestore().collection("companies").doc(id).update(data).then((result)=>{
            if(result){
                res.send({message:"Updated successfully",status:true})
            }
        }).catch((error)=>{
            console.log(error)
            res.status(500).send({message:"somthing went wrong",status:false})
        })
        
    } catch (error) {
        console.log(error)
        res.status(500).send({message:"somthing went wrong", status:false})
    }
}


const getUsersList = async (req, res) => {//for getting the userslist
    try {   
        let query = admin.firestore().collection("UserNode").where('access', '==', 'App User').where('status',"in",[1,2,"1","2"]);
        
        if (req.body.search) {
            console.log(req.body.search)
            query = query.where("username", "==", req.body.search);
        }
        const count = (await query.get()).size
        
         const snapshot = await query.offset(req.body.skip).limit(req.body.limit).get();
        let data = [];
        snapshot.forEach((doc) => {
            // console.log(doc.id)
            data.push({_id:doc.id,...doc.data()});
        });

        res.status(200).send({ data, count, message: "Users fetched successfully", status: true });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Something went wrong", status: false });
    }
};


const getcompanynames=async(req,res)=>{//for getting the companynames
    try {
        console.log("reached here")
        let data=[]
        admin.firestore().collection("companies").where("access","==","company").where("status","in",["1","2"]).get().then((snapshot)=>{
            snapshot.forEach((doc)=>{
                // console.log(doc.data())
                data.push({_id:doc.id,...doc.data()})
            })
            console.log(data)
            res.status(200).send({message:'compnay names',stauts:true,data:data})
        }).catch((error)=>{
            console.log(error)
        })
    } catch (error) {
        console.log(error)
        res.status(500).send({message:"somthing went wrong ",status:false})
    }
}


const addedituser=async(req,res)=>{//for add and edititng the user
    console.log(req.body)
    try {
        let actiontype=req.body.actiontype  
        delete req.body.actiontype
        let data=req.body
        data.access="App User"
        if(actiontype==="create"){
            data.createAt=admin.firestore.FieldValue.serverTimestamp()
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


const getuserDetails=async(req,res)=>{//for get user details
    try {
        console.log("herte")
        console.log(req.body)
        let id=req.body.id
        let docRef=await  admin.firestore().collection("UserNode").doc(id).get()
        let data=docRef.data()
        data._id=docRef.id
        res.send({message:"userDetails fetched succssfully", status:true,data:data})
    } catch (error) {
        console.log(error)
        res.status(500).send({message:"somthing went wrong",status:false})
    }
}


const userStatus=async(req,res)=>{//for change the user status
    try {
        let {id,status}=req.body
        console.log(id,status)
        admin.firestore().collection("UserNode").doc(id).update({status:status}).then((result)=>{
            res.status(200).send({message:'status updated',status:true})
        }).catch((error)=>{
            res.status(500).send({message:"somthing went wrong",status:false})
        })
    } catch (error) {
        console.log(error)
        res.status(500).send({message:"somthing went wrong",status:false})
    }
}


const deleteUser=async(req,res)=>{//for delete the user only change the status to 0=delete 1=active 2=indactive
    try {
        console.log(req.body)
        let id=req.body.ids[0]
        admin.firestore().collection("UserNode").doc(id).update({status:"0"}).then((result)=>{
            res.send({message:"deleted successfully",status:true})
        }).catch((error)=>{
            res.status(500).send({message:"somthing went wrong",status:false})
        })
    } catch (error) {
        console.log(error)
        res.status(500).send({message:"somthing went wrong",status:false})
    }
}


const bulkuploaduser=async(req,res)=>{//for bulkuploading the user
    try {
        let file=req.file
        if(!file){
           return res.status(400).send({message:'no files is uploaded',status:false})
        }
        const workbook = XLSX.read(file.buffer, { type: "buffer"}); //this is for readintg the beffer data in our req.file
        const sheetName = workbook.SheetNames[0];
        const   worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

         let datasss=jsonData.map(async(data, index) => {
            data.access="App User"
            data.status="1"
            data.mobile=data.mobile.toString()
            data.company=req.body.company
            data.companyid=req.body.companyid
            try {
                let result=await admin.firestore().collection("UserNode").add(data)
                return { success: true, id: result.id };
            } catch (error) {   
                return {success:false,error:error}
            }

        });
        let result= await Promise.all(datasss)//this is used to await until all the user are added to the firebase store and then only want to sent the response back to front end
       
        res.send({message:"Upload completed",status:true})

        
    } catch (error) {
        console.log(error)
        res.status(500).send({message:"somthing went wrong",status:false})
    }
}


const addcompanySubadmin=async(req,res)=>{//for adding the subadmin for companies
    try {
        let action=req.body.actiontype
        delete req.body.actiontype
        // console.log(req.body)
        let data=req.body
        if(action==="create"){
            admin.firestore().collection("companies").add(data).then((docRef)=>{
                // console.log(result)
                return docRef.update({_id:docRef.id}) //this is used to add the id to the document we have created in firebase
            }).then((result)=>{
                console.log(result)
                res.send({messsage:"Added succusfully",status:true})
            }).catch((error)=>{
                console.log(error)
                res.status(500).send({message:"somthing went wrong",status:true})
            })
        }else if(action=="update"){
            admin.firestore().collection("companies").doc(data._id).update(data).then((result)=>{
                res.status(200).send({message:"updata successfully",status:true})
            }).catch((error)=>{
                res.status(500).send({message:"somthing went wrong",status:false})
            })
        }
        
    } catch (error) {
        console.log(error)
        res.status(500).send({message:"somthing went wrong ",status:false})
    }
}


const companySubadminList=async(req,res)=>{//for getting the compnay subadmin list
    try {
        let query = admin.firestore().collection("companies").where('access', '==', 'companysubadmin').where('status',"in",["1","2"]);
        
        if (req.body.search) {
            console.log(req.body.search)
            query = query.where("name", "==", req.body.search);
        }
        const count = (await query.get()).size
        
         const snapshot = await query.offset(req.body.skip).limit(req.body.limit).get();
        let data = [];
        snapshot.forEach((doc) => {
            console.log(doc.id)
            data.push(doc.data());
        });

        res.status(200).send({ data, count, message: "company subadmin fetched successfully", status: true });


    } catch (error) {
        console.log(error)
        res.status(500).send({message:"somthing went wrong",status:false})
    }
}


const getcompanysubadmin=async(req,res)=>{//for getting the specific subadmin details
    try {
        let id=req.body.data
        let docRef= await admin.firestore().collection("companies").doc(id).get()
        let data=docRef.data()
        data._id=docRef.id
        res.status(200).send({message:"company details",data:data,status:true})
        
    } catch (error) {
        console.log(error)
        res.status(500).send({message:"somthing went wrong",status:false})
    }
}


const addeditBatch=async(req,res)=>{//for adding batches and users to the batches
    try {
        let action=req.body.actiontype
        delete req.body.actiontype
        let data=req.body
        
        if(action==="create"){
            
            if(data.date==="custom"){
                const startdate = moment(data.datepicker[0]).startOf('day').format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
                const endate=moment(data.datepicker[`1`]).endOf('day').format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
        
                let bathref=await admin.firestore().collection('batch').add(data)
                let companyRef=await admin.firestore().collection("companies").doc(data.companyid)
                await companyRef.update({
                    batchcount:admin.firestore.FieldValue.increment(1)
                })
                let idofBatch=bathref.id
                await bathref.update({_id:idofBatch})

                let snapshot= await admin.firestore().collection("UserNode").where("joindate", ">=", startdate).where("joindate","<=",endate).where("city","==",data.city).get();
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
                data.createAt=admin.firestore.FieldValue.serverTimestamp()//this is used to create the timestamp
                let batchRef = await admin.firestore().collection("batch").add(data);
                let companyRef=await admin.firestore().collection("companies").doc(data.companyid)
                await companyRef.update({
                    batchcount:admin.firestore.FieldValue.increment(1)
                })
                let idOfBatch = batchRef.id;
                await batchRef.update({_id: idOfBatch});

                 // Fetch user data based on the filter date
                let snapshot = await admin.firestore().collection("UserNode").where("joindate", ">=", filterDate).where("city","==",data.city).get();
                
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


const getbatchlist=async(req,res)=>{//foir getting the batchlist
    try {
        // console.log(req.body)
        let batchlist=[]
        
        let query= admin.firestore().collection("batch").where("companyid","==",req.body.id).where("status","in",["1",'2'])
        if(req.body.search){
           query= query.where("slugname","==",req.body.search)
        }
        const count = (await query.get()).size
        
         const snapshot = await query.offset(req.body.skip).limit(req.body.limit).get();
        snapshot.forEach((doc)=>{
            batchlist.push(doc.data())
        })
        res.send({message:"batchlist",count:count,status:true,data:batchlist})

    } catch (error) {
        console.log(error)
        res.status(500).send({message:"somthing went wrong",status:false})
    }
}


const batchStatus=async(req,res)=>{//for updateing the status of the the batch
    try {
        console.log(req.body);
        let {id,status}=req.body
         admin.firestore().collection("batch").doc(id).update({status:status}).then((res)=>{
            res.status(200).send({message:"status updated successfully",status:true})
        }).catch((error)=>{
            res.status(500).send({message:"somthing went wrong",status:false})
        })

    } catch (error) {
        console.log(error)
        res.status(500).send({message:"somthing went wrong",status:false})
    }
}


const getBatchDetails=async(req,res)=>{//for getting the batch details
    try {
        let {id}=req.body
        console.log(id);
        let docRef=await admin.firestore().collection('batch').doc(id).get()
        let data=docRef.data()
        data._id=docRef.id
        // console.log(data)
        res.status(200).send({message:'batch details',status:true,data:data})
        
    } catch (error) {
        console.log(error)
        res.status(500).send({message:"somthing went wrong"})
    }
}


const batchUsers=async(req,res)=>{//for getting the batch uses details
    try {
        let bathusers=[]

        try {
            let snapshot = await admin.firestore().collection("userbatch").where("batchid", "==", req.body.id).get();
        
            // Use Promise.all to wait for all asynchronous operations to complete
            let userPromises = snapshot.docs.map(async (doc) => {
                let query = admin.firestore().collection("UserNode").doc(doc.data().userid);
        
                // Adjusted the query logic for potential where clause
                if (req.body.search) {
                    let userRef = await query.get();
                    let userData = userRef.data();
                    if (userData.username === req.body.search) {
                        return userData;
                    }
                    return null; // Return null if the user does not match the search criteria
                } else { 
                    let userRef = await query.get();
                    return userRef.data();
                }
            });
        
            bathusers = (await Promise.all(userPromises)).filter(user => user !== null); // Filter out any null values
            let count = bathusers.length;
            
            res.send({ message: "batch users list", data: bathusers, status: true, count: count });
        } catch (error) {
            console.error("Error retrieving users: ", error);
            res.status(500).send({ message: "Error retrieving users", status: false, error: error.message });
        }
        
        
    } catch (error) {
        console.log(error)
        console.log(error.message)
        res.status(500).send({message:"somthing went wrong",status:false})
    }
}


const deletebathuser=async(req,res)=>{// for delete the batch users
   try {
        console.log(req.body)
        let snapshot=await admin.firestore().collection("userbatch").where("userid","==",req.body.ids[0]).get()
        snapshot.forEach((doc)=>{
            doc.ref.delete()
        })
        res.send({message:"Action successfull",status:true})
    } catch (error) {
        console.log(error)
        res.status(500).send({message:"somthing went wrong",status:false})
    }
}


const chagneBatchList=async(req,res)=>{
    try {
        let data=req.body
        console.log(data);
     
        let batchRef=await admin.firestore().collection("batch").where("companyid","==",req.body.companyid).where("status","in",["1","2"]).offset(0).limit(req.body.limit?req.body.limit:10).get()
        let batchslist=[]
        batchRef.forEach((doc)=>{
            batchslist.push(doc.data())
        })
        let currentuserBatch = await admin.firestore().collection("userbatch").where("userid", "==", data._id).get();
        let result = currentuserBatch.docs[0].data();
     
        let current=await admin.firestore().collection("batch").where("_id","==",result.batchid).get()
        let ress=current.docs[0].data()
        let batchlist=batchslist.filter(x=>x._id!==result.batchid)
        res.status(200).send({message:"batch lists",currentbatch:ress,batchlist:batchlist,status:true})
    } catch (error) {
        console.log(error)
        res.status(500).send({message:"somthing went wrong",status:false})
    }
}

const shiftBatch=async(req,res)=>{
    try {
       let snapshot= await admin.firestore().collection("userbatch").where("userid","==",req.body.userid).get()
        snapshot.forEach((doc)=>{
            doc.ref.update({batchid:req.body.batchid})
        })
        res.status(200).send({message:"batch shfited succesfully",status:true})
    } catch (error) {
        console.log(error)
        res.status(500).send({message:"somthing went wrong",status:false})
    }
}

const profileData=async(req,res)=>{
    try {
        let data=req.body
        let docRef=await admin.firestore().collection("UserNode").where("access","==",data.type).get()
        let result=docRef.docs[0].data()
        res.status(200).send({message:"admin details",status:true,data:result})
    } catch (error) {
        console.log(error)
        res.status(500).send({message:"somthing went wrong",status:false})
    }
}

const updateprofile=async(req,res)=>{
    try {
        let data=req.body
        let docRef=await admin.firestore().collection("UserNode").where("access","==","Admin").get()
        docRef.forEach((doc)=>{
            doc.ref.update(data)
        })
        res.send({message:"update successfully",status:true})
    } catch (error) {
        console.log(error)
        res.status(500).send({message:"somting went wrong",status:false})
    }
}



const adduserbatchlist=async(req,res)=>{
    try {
        let data=req.body
        let userList=[]
        let batchusers=[]
        let snapshot=(await admin.firestore().collection("batch").doc(data.batchid).get()).data()
        let userDoc=await admin.firestore().collection("UserNode").where("companyid","==",snapshot.companyid).get().then((snapshot)=>{
            snapshot.forEach((doc)=>{
                userList.push(doc.data())
            })
        })

        let batchuserslist=await admin.firestore().collection("userbatch").where("companyid","==",snapshot.companyid).get().then((result)=>{
            result.forEach((doc)=>{
                batchusers.push(doc.data())
            })
        })
        let ids=batchusers.map(x=>x.userid)
       
        const filteredArray = userList.filter(obj => !ids.includes(obj._id));
        res.status(200).send({message:"user list",status:true,data:filteredArray,companyid:snapshot.companyid})

    } catch (error) {
        console.log(error)
        res.status(500).send({message:"somthing went wrong", status:false})
    }
}



// const addUserToBatch=async(req,res)=>{
//     try {
       
//         let {data,batchid,companyid}=req.body
//         console.log(data);
//         console.log(batchid);
//         console.log(companyid);
//         for(let i=0;i<data.length;i++){
//             let userbatch=await admin.firestore().collection("userbatch").add({userid:data[i],batchid:batchid,companyid:companyid})
//             await userbatch.update({_id:userbatch.id})
//         }
//         res.status(200).send({message:"add user to batch",status:true})
        
//     } catch (error) {
//         console.log(error)
//         res.status(500).send({message:"somthing went wrong ",status:false})
//     }
// }

/**********************************************************************************************************************************************************************************************************************/

module.exports = {
    getUsersList,
    postLogin,
    roleCheck,
    subAdminslist,
    createUpdateSubAdmin,
    getSubadmin,
    deleteSubAdmin,
    companyList,
    addeditcompany,
    company_subadmin_Delete,
    getCompany,
    companyStatus,
    getcompanynames,
    addedituser,
    getuserDetails,
    userStatus,
    deleteUser,
    bulkuploaduser,
    addcompanySubadmin,
    companySubadminList,
    getcompanysubadmin,
    addeditBatch,
    getbatchlist,
    batchStatus,
    getBatchDetails,
    batchUsers,
    deletebathuser,
    chagneBatchList,
    shiftBatch,
    profileData,
    updateprofile,
    adduserbatchlist,
    addUserToBatch
}







            // const snapshot = await admin.firestore().collection("subAdmins").where("_id", "==", data._id).get();

            // if (!snapshot.empty) {
            //     const updatePromises = snapshot.docs.map(doc => 
            //         admin.firestore().collection("subAdmins").doc(doc.id).update(data)
            //     );
    
            //     await Promise.all(updatePromises);
            //     res.status(200).send({ message: "Sub admin updated successfully", status: true });
            // } else {
            //     res.status(404).send({ message: "No sub admin found with the given ID", status: false });
            // }


            ////////////////////////////////////////////////////////////////////////////////////pagination implemented by me itself



            // let data = []
            // let query = admin.firestore().collection("subAdmins");
            // console.log(req.body);
            // if (req.body.search) {
            //     console.log("inside");
            //     query = query.where("name", "==", req.body.search);
            // }
            // const collectionRef = admin.firestore().collection('subAdmins');
            // const snapshot = await collectionRef.count().get();
            // let counts=snapshot.data().count
            // query.where("access","==","subAdmin").limit(req.body.limit).offset(req.body.skip).get()
            // .then(snapshot => {
            //               snapshot.forEach(doc => {
            //                     data.push(doc.data())
            //             })
            //             res.send({ message: "sub admin list", data: data, status: true,count:counts }) //here want to implement the actual count of the document that we got
            //         }) 



            //**********************************************************************************update methode another way*********************************************************


            //  let result= admin.firestore().collection("subAdmins").where("_id","==",data._id).get()
            //  .then(snapshot=>{
            //     snapshot.forEach((doc)=>{
            //         admin.firestore().collection("subAdmins").doc(doc.id).update(data).then((res)=>{
            //             return res.send({message:"Updated successfully",status:true})
            //         }).catch((error)=>{
            //             console.log(error);
            //             return res.status(500).send({message:"somthing went wrong",status:true})
            //         })
            //     })
            //  })

            //***********************************************************************************delete the documetn ***************************************************************************


            // let snapshots=await admin.firestore().collection("companies").where("access","==","App User").get()
            // snapshots.docs.map((doc)=>doc.ref.delete())


            //////////***************************************************************batch creation original code written by me */
        //     let today=moment().endOf('day').format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
        //     let filterdate=moment().subtract(data.date,"months").startOf('day').format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
        //     let idofbatch
        //    await admin.firestore().collection("batch").add(data).then((docRef)=>{
        //         idofbatch=docRef.id
        //         return docRef.update({_id:docRef.id})
        //     })
        //     let userdatas=[]
        //    await admin.firestore().collection("UserNode").where("joindate",">=",filterdate).get().then((snapshot)=>{
        //         snapshot.forEach((doc)=>{
        //             userdatas.push(doc.data())
        //         })
        //     })  
        //     let userids=userdatas.map(x=>x._id)
        //     for(let id of userids){
        //         admin.firestore().collection("userbatch").add({userid:id,batchid:idofbatch}).then((docref)=>{
        //             return docref.update({_id:docref.id})
        //         })
        //     }
        //     res.send({message:"batch created",status:true})
        