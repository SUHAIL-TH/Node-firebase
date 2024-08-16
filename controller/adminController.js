const XLSX  =require("xlsx");
const moment=require("moment")
const {admin}=require("../config/firebaseConfig")
const firebbase = require("firebase-admin");
const SmptSchema =require("../model/stmpt")



// const admin = require("firebase-admin")
// const firebase=require('firebase')
// admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount)
// })


//**************************************************************************************** Admin ******************************************************************************************************** */

const roleCheck = async (req, res) => { // used to check the role of the login admin
    try {
        let { email } = req.body
        // console.log(email)
        const usersRef = admin.firestore().collection('UserNode');
        const querySnapshot = await usersRef.where('email', '==', email).get();
        // console.log(querySnapshot.docs[0].data())

        if (querySnapshot.empty) {
            return res.send({ message: 'Unautherizes Access', status: false })
        }
        let userData = [];
        querySnapshot.forEach(doc => {
            userData.push(doc.data());
        });
        // console.log(userData[0]);
        res.send({ message: "successfull", data: userData[0], status: true })
    } catch (error) {
        console.log(error)
        res.status(500).send({ message: "somthing went wrong!contact Admin", status: false })
    }
}


const postLogin = async (req, res) => { // for login implemting login currenly not in use
    let email = req.body.email
    let password = req.body.password
    // console.log(email, password);
    try {
        const userRecord = await admin.auth().getUserByEmail(email)
        // console.log(userRecord);
    } catch (error) {
        console.log(error)
        res.status(500).send({ message: "Somthing Went wrong", status: false })
    }
}


// const subAdminslist = async (req, res) => {//for getting the subadminlist
//     try {
//         let data = [];
//         let query = admin.firestore().collection('UserNode').where("access","==","subAdmin").where("status","in",["1","2"]);
       

//         if (req.body.search) {
//             query = query.where("name", "==", req.body.search);
//         }

//         const snapshotCount = await query.get();
//         const count = snapshotCount.size;

//         query = query.offset(req.body.skip).limit(req.body.limit).orderBy('createAt','desc');

//         // Execute the query
//         const snapshot = await query.get();
//         snapshot.forEach(doc => {
//             data.push(doc.data());
//         });

//         res.send({ message: "Sub admin list", data: data, status: true, count: count });
//     } catch (error) {
//         console.error("Error:", error);
//         res.status(500).send({ message: "Something went wrong", status: false });
//     }
// };
const subAdminslist = async (req, res) => {
    try {
        let data = [];
        let queryByName = admin.firestore().collection('UserNode').where("access", "==", "subAdmin").where("status", "in", ["1", "2"]).orderBy('createAt', 'desc');
        let queryByEmail = admin.firestore().collection('UserNode').where("access", "==", "subAdmin").where("status", "in", ["1", "2"]).orderBy('createAt', 'desc');

        // Check if search parameter exists and perform a search on both name and email
        if (req.body.search) {
            const searchTerm = req.body.search.toLowerCase();

            // Convert searchTerm to lower case for case-insensitive search
            queryByName = queryByName.where("name", ">=", searchTerm)
                                     .where("name", "<=", searchTerm + "\uf8ff");

            queryByEmail = queryByEmail.where("email", ">=", searchTerm)
                                       .where("email", "<=", searchTerm + "\uf8ff");
        }

        // Execute the queries
        const [snapshotByName, snapshotByEmail] = await Promise.all([
            queryByName.get(),
            queryByEmail.get()
        ]);

        // Merge results from both queries into data array
        snapshotByName.forEach(doc => {
            data.push(doc.data());
        });

        snapshotByEmail.forEach(doc => {
            // Check if the document is already in data array to avoid duplicates
            if (!data.some(d => d.email === doc.data().email)) {
                data.push(doc.data());
            }
        });

        // Sort data array by createAt timestamp in descending order
        data.sort((a, b) => b.createAt - a.createAt);

        const count = data.length;

        res.send({ message: "Sub admin list", data: data, status: true, count: count });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send({ message: "Something went wrong", status: false });
    }
};





const createUpdateSubAdmin = async(req, res) => {// for to add/update subadmin to the firestore
    try {
        const actiontype = req.body.actiontype; 
        // console.log(req.body);
        delete req.body.actiontype;
        let data =req.body
        data.webaccess="1"
        data.username=req.body.name
        data.slugname=req.body.name.toLowerCase()
     
        // console.log(data)
         if(actiontype==="create"){
            data.createAt=firebbase.firestore.FieldValue.serverTimestamp()
            admin.firestore().collection('UserNode').add(data)
            .then((result) => {

                res.status(200).send({ message: "Sub admin Added successfully", status: true })
            }).catch((error) => {
                console.log(error);
                res.status(500).send({ message: "Error in while adding data", status: false })
            })
         }else if(actiontype==="update"){
            const snapshot = await admin.firestore().collection("UserNode").where("_id", "==", data._id).get();
            if (!snapshot.empty) {
                const updatePromises = snapshot.docs.map(doc =>
                    admin.firestore().collection("UserNode").doc(doc.id).update(data)
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
        let data = await admin.firestore().collection("UserNode").where("_id", "==", id).get()
        const doc = data.docs[0];
        const docData = doc.data();
        res.status(200).send({message:"sub admin data",status:true,data:docData})
       
    } catch (error) {
        console.log(error)
        res.status(500).send({ message: "somthing went wrong", status: false })
    }
}


const deleteSubAdmin = async (req,res)=>{ // for deleting the subadmin
    let id = req.body.ids[0];
    let query = await admin.firestore().collection('UserNode').where("_id", "==", id);

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

const permanentDeleteUser = async (req, res) => {
    try {
        const userIds = req.body.ids;

        if (!Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).send({ message: "Please select a user", status: false });
        }

        console.log(userIds);
        await Promise.all(userIds.map(id => admin.firestore().collection("UserNode").doc(id).delete()));

        res.send({ message: "User Deleted Successfully", status: true });
    } catch (error) {
        console.log(error);
        res.status(500).send({ message: "Something went wrong", status: false });
    }
};




const restoreUser=async(req,res)=>{//for restoring the user form soft delete
    try {
        let userRef= admin.firestore().collection("UserNode").doc(req.body.ids)
       await  userRef.update({
            status:"1"
        })
        res.send({message:"User restored",status:true})
    } catch (error) {
        console.log(error)
        res.status(500).send({message:"somthing went wrong",status:false})
    }
}


const companyList = async (req,res)=>{// for getting the company list
    try {
        // console.log(req.body)
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
        let data=[]
        let collectionRef=admin.firestore().collection("UserNode").where('access',"==","company").where("status","in",status)
        if(req.body.search){
            let searchTerm=req.body.search.toLowerCase()
            // collectionRef=collectionRef.where("slugname","==",search)
            collectionRef = collectionRef.where("slugname", ">=", searchTerm)
                                     .where("slugname", "<=", searchTerm + "\uf8ff");
        }
        let snapshotCount=await collectionRef.get()
        let count=snapshotCount.size; 
        // let allcount=(await admin.firestore().collection("UserNode").where("access","==","company").where("status","in",["1","2"]).get()).size
        // let activecoutn=(await admin.firestore().collection("UserNode").where("access","==","company").where("status","==","1").get()).size
        // let inactivecount=(await admin.firestore().collection("UserNode").where("access","==","company").where("status","==","2").get()).size
        // let deletecount=(await admin.firestore().collection("UserNode").where("access","==","company").where("status","==","0").get()).size
        collectionRef=collectionRef.offset(req.body.skip).limit(req.body.limit).orderBy('createAt','desc'); //here want to add orderBy also to sort the document
        collectionRef.get().then((snapshot)=>{
            snapshot.forEach((doc)=>{
                let insertdata=doc.data()
                insertdata._id=doc.id
                data.push(insertdata)
            })
            // console.log(allcount,activecoutn,inactivecount,deletecount)
            res.status(200).send({message:"companies list ",status:true,data:data,count:count })
        }).catch((error)=>{
            console.log(error)
            res.status(500).send({message:"somthing went wrong",status:false})
        })


    } catch (error) {
        console.log(error)
        res.status(500).send({message:"somthing went wrong",status:false})
    }
}


const batchCompanyList=async(req,res)=>{
    try {
    //    console.log(req.body)
        let data=[]
        let collectionRef=admin.firestore().collection("UserNode").where('access',"==","company").where("status","in",["1"])
        if(req.body.search){
            let searchTerm=req.body.search.toLowerCase()
            collectionRef = collectionRef.where("slugname", ">=", searchTerm)
                                     .where("slugname", "<=", searchTerm + "\uf8ff");
        }
        let snapshotCount=await collectionRef.get()
        let count=snapshotCount.size; 
     
        collectionRef=collectionRef.offset(req.body.skip).limit(req.body.limit).orderBy('createAt','desc'); //here want to add orderBy also to sort the document
        collectionRef.get().then((snapshot)=>{
            snapshot.forEach((doc)=>{
                let insertdata=doc.data()
                insertdata._id=doc.id
                data.push(insertdata)
            })
           
            res.status(200).send({message:"companies list ",status:true,data:data,count:count })
        }).catch((error)=>{
            console.log(error)
            res.status(500).send({message:"somthing went wrong",status:false})
        })
    } catch (error) {
        console.log(error)
        res.status(500).send({message:"somthing went wrong",status:false})
    }
}


const   addeditcompany = async (req, res) => { //for adding and editing companies
    try {
        let type=req.body.actiontype
        delete req.body.actiontype
        let data = req.body;
        data.webaccess="1"
        console.log(req.body)
        let lowercasecity=[]
        // let citydata=data.city
        // for(let i=0;i<citydata.length;i++){
        //     lowercasecity.push(citydata[i].toLowerCase())
        // }
        console.log(data)
        if(type==="create"){
            data.createAt=firebbase.firestore.FieldValue.serverTimestamp()
            data.activeuserscount=0
            data.totalusers=0
            data.trainerscount=0
            data.clientadmincount=0
            data.batchcount=0
            const docRef = await admin.firestore().collection("UserNode").add(data)
            // .then((result)=>{
            //     if(result){
            //         res.status(200).send({ message: "Company added", status: true, });
            //     }
            // }).catch((error)=>{
            //     console.log(error)
            //     res.status(500).send({message:"somthing went wrong",status:false})
            // })
            const id = docRef.id;                                                        //in this way we can add the id manually inside the collection
            await admin.firestore().collection("UserNode").doc(id).set({ ...data, _id: id }, { merge: true }).then((result)=>{
                 res.status(200).send({ message: "Company added", status: true, });
            })
        }else if(type==="update"){
            // console.log(req.body)
            let data=req.body
            let result=await admin.firestore().collection("UserNode").doc(data._id).update(data).then((result)=>{
                // console.log(res)
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


const companyDelete = async (req,res)=>{//for deleting the company
    try {
        let ids=req.body.ids
        let batch=admin.firestore().batch()
        ids.forEach((id)=>{
            const batchref=admin.firestore().collection("UserNode").doc(id)
            batch.update(batchref,{status:"0"})

        })
        await   batch.commit()

        res.send({message:"deleted successfully",status:true})
        
        
    } catch (error) {
        console.log(error)
        res.status(500).send({message:"somthing went wrong",status:false})
    }
}
const company_subadmin_Delete = async (req,res)=>{//for deleting the company
    try {
        let ids=req.body.ids
        let batch=admin.firestore().batch()
        let count=0
        await Promise.all(ids.map(async(id)=>{
            count++
            const dataRef=admin.firestore().collection("UserNode").doc(id)
            const companyid=(await dataRef.get()).data().companyid
            let comref=admin.firestore().collection("UserNode").doc(companyid)
            comref.update({clientadmincount:firebbase.firestore.FieldValue.increment(-1)})
            const data=(await dataRef.get()).data().uid
            batch.delete(dataRef)
            await admin.auth().deleteUser(data)
        }))

      
        await   batch.commit()

        res.send({message:"deleted successfully",status:true})
        
        
    } catch (error) {
        console.log(error)
        res.status(500).send({message:"somthing went wrong",status:false})
    }
}


const getCompany = async (req,res)=>{//for getting the companydetails one at a time
    try {
        // console.log(req.body);
        let id=req.body.data
        let docRef= await admin.firestore().collection("UserNode").doc(id).get()
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
        await admin.firestore().collection("UserNode").doc(id).update(data).then((result)=>{
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

const getUsersList=async(req,res)=>{
    try {
     console.log(req.body)
     
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
        
            reqdata.To_Date=moment(reqdata.To_Date).endOf('day').format('YYYY-MM-DDTHH:mm:ss.SSS[Z]')
            console.log(reqdata.To_Date)
            query=query.where("joindate", "<=", reqdata.To_Date)
        }
        
        if(req.body.search){
            console.log("inside")
            let searchTerm=req.body.search.toLowerCase()
            console.log(searchTerm)
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
                
               
                
           

        

    } catch (error) {
        console.log(error)
        res.status(500).send({message:"somthing went wrong ",statusP:false})
    }
}

const getUsersLists= async (req, res) => {
    try {
        // console.log(req.body)
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
                // let allcount=(await admin.firestore().collection("UserNode").where("access","==","App User").where("status","in",["1","2"]).get()).size
                // let activecoutn=(await admin.firestore().collection("UserNode").where("access","==","App User").where("status","==","1").get()).size
                // let inactivecount=(await admin.firestore().collection("UserNode").where("access","==","App User").where("status","==","2").get()).size
                // let deletecount=(await admin.firestore().collection("UserNode").where("access","==","App User").where("status","==","0").get()).size
        let query = admin.firestore().collection("UserNode")
            .where('access', '==', 'App User')
            .where('status', 'in', status);

        if (req.body.search) {
            let searchTerm = req.body.search.toLowerCase();
            let endTerm = searchTerm.replace(/.$/, c => String.fromCharCode(c.charCodeAt(0) + 1));

           
            const usernameQuery = query.where('username', '>=', searchTerm)
                                      .where('username', '<', endTerm);

            const emailQuery = query.where('email', '>=', searchTerm)
                                   .where('email', '<', endTerm);
            const [usernameSnapshot, emailSnapshot] = await Promise.all([
                usernameQuery.get(),
                emailQuery.get()
            ])

            let data = [];
            usernameSnapshot.forEach(doc => {
                data.push({_id: doc.id, ...doc.data()});
            });
            emailSnapshot.forEach(doc => {
                if (!data.some(item => item._id === doc.id)) {
                    data.push({_id: doc.id, ...doc.data()});
                }
            });
            const count = data.length;
           // res.status(200).send({data,count,message: "Users fetched successfully",status: true,all:allcount??0,active:activecoutn??0,inactive:inactivecount??0,delete:deletecount??0});
           res.status(200).send({
                data,
                count,
                message: "Users fetched successfully",
                status: true,
            });
        } else {
            // Handle case where no search term is provided
            let count=(await query.get()).size
            const snapshot = await query.offset(req.body.skip).limit(req.body.limit).orderBy("createAt","desc").get();
            let data = [];
            snapshot.forEach(doc => {
                data.push({_id: doc.id, ...doc.data()});
            });
            // res.status(200).send({data,count,message: "Users fetched successfully",status: true,all:allcount??0,active:activecoutn??0,inactive:inactivecount??0,delete:deletecount??0});
            res.status(200).send({
                data,
                count,
                message: "Users fetched successfully",
                status: true,
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Something went wrong", status: false });
    }
};



const getcompanynames=async(req,res)=>{//for getting the companynames
    try {
        // console.log("reached here")
        let data=[]
        admin.firestore().collection("UserNode").where("access","==","company").where("status","in",["1","2"]).get().then((snapshot)=>{
            snapshot.forEach((doc)=>{
                // console.log(doc.data())
                data.push({_id:doc.id,...doc.data()})
            })
            // console.log(data)
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
                    activeuserscount:firebbase.firestore.FieldValue.increment(1),
                    totalusers:firebbase.firestore.FieldValue.increment(1)
                })
                data.createAt=firebbase.firestore.FieldValue.serverTimestamp()
                data.profile="User"
                admin.firestore().collection("UserNode").add(data)
                .then((dodRef)=>{
                    return dodRef.update({_id:dodRef.id})
                }).then((result)=>{
                  

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
           
            let phonecheck=await admin.firestore().collection("UserNode").where("mobile","==",req.body.mobile).where("_id","!=",data._id).get()
            let emailcheck=(await admin.firestore().collection("UserNode").where("email","==",req.body.email).get()).size
            let count=phonecheck.size
         
            if(count<=0){
                if(emailcheck>0){
                    admin.firestore().collection("UserNode").doc(data._id).update(data).then((result)=>{
                        res.status(200).send({message:'updated successfully',status:true})
                        
                    }).catch((error)=>{
                        res.status(500).send({message:"somthing went wrong",status:false})
                    })
                }else{
                    res.send({message:"Email already exsisted",status:false})
                }
            

            }else{
                res.send({message:"Phone number already exsisted",status:false})
            }

        }
    } catch (error) {
        console.log(error)
        res.status(500).send({message:"somthing went wrong",status:false})
    }
}


const getuserDetails=async(req,res)=>{//for get user details
    try {
        // console.log("herte")
        // console.log(req.body)
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


const userStatus = async (req, res) => { //for updating the status of the user and changing the count of the active users for the company at the same time

    try {
        let { id, status } = req.body;

        const userDocRef = admin.firestore().collection("UserNode").doc(id);

        await admin.firestore().runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userDocRef);

            if (!userDoc.exists) {
                throw new Error("User document does not exist!");
            }

            const companyId = userDoc.data().companyid;
            const companyDocRef = admin.firestore().collection("UserNode").doc(companyId);

            const companyDoc = await transaction.get(companyDocRef);

            if (!companyDoc.exists) {
                throw new Error("Company document does not exist!");
            }

            const activeuserscount = companyDoc.data().activeuserscount; 
            if(status==2){//here we update the number of the active users according to the status we want to change

                transaction.update(companyDocRef, { activeuserscount: activeuserscount - 1 });
            }else{
                transaction.update(companyDocRef, { activeuserscount: activeuserscount + 1 });

            }

        });

        await admin.firestore().collection("UserNode").doc(id).update({ status: status });

        res.status(200).send({ message: 'status updated', status: true });
    } catch (error) {
        console.log(error);
        res.status(500).send({ message: "something went wrong", status: false });
    }
};



// const deleteUser=async(req,res)=>{//for delete the user only change the status to 0=delete 1=active 2=indactive
//     try {
//         console.log(req.body)
//         let id=req.body.ids[0]
//         admin.firestore().collection("UserNode").doc(id).update({status:"0"}).then((result)=>{
//             res.send({message:"deleted successfully",status:true})
//         }).catch((error)=>{
//             res.status(500).send({message:"somthing went wrong",status:false})
//         })
//     } catch (error) {
//         console.log(error)
//         res.status(500).send({message:"somthing went wrong",status:false})
//     }
// }

const deleteUser = async (req, res) => {
    try {
        const ids = req.body.ids;
        const batch = admin.firestore().batch();

        ids.forEach(id => {
            const userRef = admin.firestore().collection("UserNode").doc(id);
            batch.update(userRef, { status: "0" });
        });

        await batch.commit();

        res.send({ message: "deleted successfully", status: true });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "something went wrong", status: false });
    }
};


const bulkuploaduser=async(req,res)=>{//for bulkuploading the user
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
            // console.log(data.joindate)
            
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
                                // console.log(companydata)
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


const addcompanySubadmin=async(req,res)=>{//for adding the subadmin for companies
    try {
        console.log(req.body)
        let action=req.body.actiontype
        delete req.body.actiontype
        let data=req.body
        data.webaccess="1"
        if(action==="create"){
            let companyref=admin.firestore().collection('UserNode').doc(req.body.companyid)
            companyref.update({clientadmincount:firebbase.firestore.FieldValue.increment(1)})
            data.createdAt=firebbase.firestore.FieldValue.serverTimestamp()
            admin.firestore().collection("UserNode").add(data).then((docRef)=>{
               
                return docRef.update({_id:docRef.id}) //this is used to add the id to the document we have created in firebase
            }).then((result)=>{
               
                res.send({messsage:"Added succusfully",status:true})
            }).catch((error)=>{
                console.log(error)
                res.status(500).send({message:"somthing went wrong",status:true})
            })
        }else if(action=="update"){
            admin.firestore().collection("UserNode").doc(data._id).update(data).then((result)=>{
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
        let query = admin.firestore().collection("UserNode").where('access', '==', 'companysubadmin').where('status',"in",["1","2"]);
        
        if (req.body.search) {
            // console.log(req.body.search)
            query = query.where("name", "==", req.body.search);
        }
        const count = (await query.get()).size
        
         const snapshot = await query.offset(req.body.skip).limit(req.body.limit).orderBy("createdAt","desc").get();
        let data = [];
        snapshot.forEach((doc) => {
            // console.log(doc.id)
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
        let docRef= await admin.firestore().collection("UserNode").doc(id).get()
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
                // await bathref.update({_id:idofBatch})

                let snapshot= await admin.firestore().collection("UserNode").where("access","==","App User")
                .where("companyid","==",data.companyid).where("joindate", ">=", startdate).where("joindate","<=",endate)
                .where("city","==",data.city).where("status","in",["1"]).get();
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

                // Wait for all batchPromises to resolve
                await Promise.all(batchPromises);

                res.send({message: "Batch created", status: true});
        
            }else{
                
                let today = moment().endOf('day').format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
                let filterDate = moment().subtract(data.date, "months").startOf('day').format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
                let batchdata=req.body
                let companyShort = data.company.slice(0, 2).toUpperCase();   
                let cityShort = data.city.slice(0, 2).toUpperCase();  
                let teamShort = data.team.map(item => item.slice(0, 2)).join('').toUpperCase();  
                let roleShort = data.role.map(item => item.slice(0, 2)).join('').toUpperCase(); 
                let todaydata = new Date().toISOString().slice(5, 10).replace(/-/g, '-');


                let shortname = `${companyShort}${cityShort}${teamShort}${roleShort}_${todaydata}`;
                data.shortname=shortname
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
                let snapshot = await admin.firestore().collection("UserNode").where("access","==","App User").where("companyid","==",data.companyid)
                .where("joindate", ">=", filterDate).where("city","==",data.city)
                .where("status","in",["1"]).get();
                
                let userDatas = [];
                snapshot.forEach(doc => {
                    userDatas.push(doc.data());
                });
                let userCount=userDatas.length
                
                await batchRef.update({_id: idOfBatch,usercount:userCount});
               
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
            // console.log(req.body)
            await admin.firestore().collection("batch").doc(data._id).update(data)
            res.status(200).send({message:"updated successfully",status:true})

        }
    } catch (error) {
        console.log(error)
        res.status(500).send({message:"somthing went wrong",status:false})
    }
}


const getbatchlist=async(req,res)=>{//for getting the batchlist
    try {
        console.log(req.body)

        
        const filters = req.body.filter_action;
        let bathreQuery = admin.firestore().collection("batch").where("companyid", "==", filters.Company);
        
        if (filters.From_Date) {
            filters.From_Date = moment(filters.From_Date).startOf('day').format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
            bathreQuery = bathreQuery.where("startdate", ">=", filters.From_Date);
        }
        
        if (filters.To_Date) {
            filters.To_Date = moment(filters.To_Date).endOf('day').format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
            bathreQuery = bathreQuery.where("startdate", "<=", filters.To_Date);
        }
        
        if (req.body.search) {
            let searchTerm = req.body.search;
            bathreQuery = bathreQuery.where("slugname", ">=", searchTerm)
                                     .where("slugname", "<=", searchTerm + "\uf8ff");
        }
        
        // Log filter values
        console.log('Filters:', filters);
        
        try {
            const baseSnapshot = await bathreQuery.get();
            let baseData = [];
            baseSnapshot.forEach(doc => {
                baseData.push({_id: doc.id, ...doc.data()});
            });
        
            // Log base data
            console.log('Base data retrieved:', baseData.length);
            console.log('Base data:', JSON.stringify(baseData, null, 2));
        
            // Apply additional filtering for 'City'
            let filteredData = baseData;
        
            if (Array.isArray(filters.City) && filters.City.length > 0) {
                filteredData = filteredData.filter(doc => {
                    const matches = doc.city && doc.city.some(city => filters.City.includes(city));
                    console.log(`Filtering by city: ${filters.City}, Document city: ${doc.city}, Matches: ${matches}`);
                    return matches;
                });
        
                // Log after city filtering
                console.log('Filtered data by city length:', filteredData.length);
                console.log('Filtered data by city:', JSON.stringify(filteredData, null, 2));
            }
        
            // Apply additional filtering for 'Role'
            if (Array.isArray(filters.Role) && filters.Role.length > 0) {
                filteredData = filteredData.filter(doc => {
                    const matches = doc.role && doc.role.some(role => filters.Role.includes(role));
                    console.log(`Filtering by role: ${filters.Role}, Document role: ${doc.role}, Matches: ${matches}`);
                    return matches;
                });
        
                // Log after role filtering
                console.log('Filtered data by role length:', filteredData.length);
                console.log('Filtered data by role:', JSON.stringify(filteredData, null, 2));
            }
        
            // Apply pagination
            const count = filteredData.length;
            filteredData = filteredData.slice(req.body.skip, req.body.skip + req.body.limit);
        
            // Log after pagination
            console.log('Paginated data length:', filteredData.length);
            console.log('Paginated data:', JSON.stringify(filteredData, null, 2));
        
            // Send response
            res.send({ message: "batchlist", count: count, status: true, data: filteredData });
        } catch (error) {
            console.error('Error retrieving data:', error);
            res.status(500).send({ message: "Error retrieving data", status: false });
        }
        
        


        
        
        
        

    } catch (error) {
        console.log(error)
        res.status(500).send({message:"somthing went wrong",status:false})
    }
}




const batchStatus=async(req,res)=>{//for updateing the status of the the batch
    try {
        // console.log(req.body);
        let {id,status}=req.body
         admin.firestore().collection("batch").doc(id).update({status:status}).then((result)=>{
            res.send({message:"status updated successfully",status:true})
        }).catch((error)=>{
            console.log(error);
            res.status(500).send({message:"somthing went wrong",status:false})
        })

    } catch (error) {
        console.log(error)
        res.status(500).send({message:"somthing went wrong",status:false})
    }
}


const getBatchDetails=async(req,res)=>{//for getting the batch details
    try {
        console.log(req.body)
        const {id}=req.body
        const docRef=await admin.firestore().collection('batch').doc(id).get()
        const data=docRef.data()
        data._id=docRef.id
        res.status(200).send({message:'batch details',status:true,data:data})
        
    } catch (error) {
        console.log(error)
        res.status(500).send({message:"somthing went wrong"})
    }
}



const batchUsers = async (req, res) => { // For getting the batch users list
    try {
        const { id, skip = 0, limit = 10, search = '' } = req.body;

        if (!id) {
            return res.status(400).send({ message: "Batch ID is required", status: false });
        }

        // const batchQuery = admin.firestore().collection("userbatch")
        //     .where("batchid", "==", id)
        //     .offset(skip)
        //     .limit(limit);
        const batchQuery = admin.firestore().collection("userbatch")
        .where("batchid", "==", id);

        const countQuery = admin.firestore().collection("userbatch")
            .where("batchid", "==", id);

        const [snapshot, countSnapshot] = await Promise.all([batchQuery.get(), countQuery.get()]);
        let batchid=snapshot.docs[0].data().batchid
        let companyid=snapshot.docs[0].data().companyid
        console.log(companyid)
        

        const regex = new RegExp(search, 'i'); // Create a regex from the search string, case-insensitive
        

        const userPromises = snapshot.docs.map(async (doc) => {
            const userData = doc.data().userdata;
            
            // const userId = doc.data().userid;
            // const userRef = admin.firestore().collection("UserNode").doc(userId);
            // const userDoc = await userRef.get();
            // const userData = userDoc.data();

            if (userData && regex.test(userData.username)) {
                return userData;
            }
            return null;
        });

    //    let batchid=userData[0]
    const users = (await Promise.all(userPromises)).filter(user => user !== null);
    const count = countSnapshot.size;
    let batchdata=(await admin.firestore().collection("batch").doc(batchid).get()).data()
    let companydata=(await admin.firestore().collection("UserNode").doc(companyid).get()).data()
    // console.log(companydata)
    // console.log(batchdata)

        res.send({ message: "Batch users list", data: users, status: true, count ,batchdata:batchdata,companydata});
    } catch (error) {
        console.error("Error retrieving users: ", error);
        res.status(500).send({ message: "Error retrieving users", status: false, error: error.message });
    }
};


const deletebathuser=async(req,res)=>{// for delete the batch users
   try {
        console.log("-------------------------------------------------------------------------------------------------------");
        // console.log(req.body)
        let snapshot=await admin.firestore().collection("userbatch").where("userid","==",req.body.ids[0]).get()
        // console.log(snapshot.docs[0].data())
        let userbatchdata=snapshot.docs[0].data()
        console.log(userbatchdata);
        let batchref=admin.firestore().collection("batch").doc(userbatchdata.batchid)
        let batchdata=await (await batchref.get()).data()


        snapshot.forEach((doc)=>{
            doc.ref.delete()
        })
        batchref.update({usercount:batchdata.usercount-1})
        res.send({message:"Action successfull",status:true})
    } catch (error) {
        console.log(error)
        res.status(500).send({message:"somthing went wrong",status:false})
    }
}



const chagneBatchList=async(req,res)=>{//for getting the specific company change batch list
    try {
        let data=req.body
        let currentuserBatch = await admin.firestore().collection("userbatch").where("userid", "==", data._id).get();
        let result = currentuserBatch.docs[0].data();
        let current=await admin.firestore().collection("batch").where("_id","==",result.batchid).get()
        let ress=current.docs[0].data()
        let batchslist=[]
      

       
        const db = admin.firestore();

        const batchCollection = db.collection('batch');

        async function getBatches(companyId, city, roles) {
        try {
            // Create the initial query with the first set of conditions
            let batchQuery = batchCollection
            .where('companyid', '==', companyId)
            .where('status', 'in', ['1', '2'])
            .where('city', '==', city);
            let roleQueries = [];

            // Create a separate query for each role in the roles array
            roles.forEach(role => {
            let roleQuery = batchQuery.where('role', 'array-contains', role).get();
            roleQueries.push(roleQuery);
            });

            // Execute all the queries in parallel
            let querySnapshots = await Promise.all(roleQueries);

            // Collect all documents from the results
            
            querySnapshots.forEach(querySnapshot => {
            querySnapshot.forEach(doc => {
                batchslist.push(doc.data());
            });
            });

            return batchslist;
        } catch (error) {
            console.error('Error getting documents: ', error);
        }
        }

        // Example usage
        const companyId = req.body.companyid;
        const city = ress.city;
        const roles = ress.role;

        getBatches(companyId, city, roles).then(docs => {
        // console.log('Retrieved documents:', docs);
        let batchlist=batchslist.filter(x=>x._id!==result.batchid)
        res.status(200).send({message:"batch lists",currentbatch:ress,batchlist:batchlist,status:true})
        });
            
    } catch (error) {
            console.log(error)
            res.status(500).send({message:"somthing went wrong",status:false})
    }
}



const profileData=async(req,res)=>{//for getting the profile data  of admin 
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





const updateprofile=async(req,res)=>{//for updateing the profile of admin
    try {
        let data=req.body
        let docRef=await admin.firestore().collection("UserNode").where("access","==","Admin").get()
        docRef.forEach((doc)=>{
            doc.ref.update(data)
        })
        let adminid=await docRef.docs[0].data()._id
        // console.log(adminid)
        let admindata=(await admin.firestore().collection("UserNode").doc(adminid).get()).data()
        
        res.send({message:"update successfully",status:true,data:admindata})
    } catch (error) {
        console.log(error)
        res.status(500).send({message:"somting went wrong",status:false})
    }
}


const adduserbatchlist=async(req,res)=>{//listing the user of specific compnay to add to the batch
    try {
        let data=req.body.batchid //this is actually company id
        let userList=[]
        let batchusers=[]
        let snapshot=(await admin.firestore().collection("batch").doc(data).get()).data()
        console.log(snapshot)
        
        let userDoc=await admin.firestore().collection("UserNode").where("access","==","App User").where("companyid","==",snapshot.companyid).where("city","==",snapshot.city).get().then((snapshot)=>{
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


const addUserToBatch=async(req,res)=>{//for addint the user to specific batch
    try {
       
        let {data,batchid,companyid}=req.body
        console.log(req.body)
        for(let i=0;i<data.length;i++){
            let userbatch=await admin.firestore().collection("userbatch").add({userid:data[i],batchid:batchid,companyid:companyid})
            await userbatch.update({_id:userbatch.id})
        }
        let batchref= admin.firestore().collection("batch").doc(batchid)
        let batchdata=await (await batchref.get()).data()
     
        if(batchdata.usercount===undefined){
            batchref.update({usercount:1})
        }else{
            console.log("inside of thies")
            batchref.update({usercount:batchdata.usercount+1})
        }
        res.status(200).send({message:"add user to batch",status:true})
        
    } catch (error) {
        console.log(error)
        res.status(500).send({message:"somthing went wrong ",status:false})
    }
}


const deletedUserslist=async(req,res)=>{//fot getting the delted users list
    try {
        // console.log("request reached here");
        let userRef=await admin.firestore().collection("UserNode").where("access","==","App User").where("status","==","0").get()
        let deletedUser=[]
        userRef.forEach((doc=>{
            deletedUser.push(doc.data())
        }))
        // console.log(deletedUser)
    } catch (error) {
        console.log(error)
        res.status(500).send({message:"somthing went wrong",statsu:false})
    }
}


const addeditTrainer=async(req,res)=>{//for adding and editing the trainer
    try {
        console.log(req.body)
        let action=req.body.actiontype
        delete req.body.actiontype
        let data=req.body
        if(action==="create"){
            const companyRef = await admin.firestore().collection("UserNode").doc(req.body.companyid);
            console.log("==========================================")
            let companydata=(await companyRef.get()).data()
            console.log(companydata)
            data.companydata=companydata
            companyRef.update({   
              trainerscount: firebbase.firestore.FieldValue.increment(1)
            });
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
        res.status(500).send({message:"somthing ",status:false})
    }
}


const trainersList = async (req, res) => {//for getting the trainers list
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

        console.log(trainerList);

        res.send({ message: "Trainers fetched successfully", status: true, data: trainerList,count:size });

    } catch (error) {
        console.log(error);
        res.status(500).send({ message: "Something went wrong", status: false });
    }
};



const updateTrainerStatus=async(req,res)=>{//this is for updateing the trainer status
    try {
        let {id,status}=req.body
        let docRef=await admin.firestore().collection("UserNode").doc(id)
        await docRef.update({status:status})
        res.send({message:"Updated Successfully",status:true})
    } catch (error) {
        console.log(error)
        res.status(500).send({message:"Somthing went wrong",status:false})
    }
}


const deleteTrainer=async(req,res)=>{//this is for deleting the trainer
    try {
        // console.log(req.body)
        let id=req.body.ids
        let batch=admin.firestore().batch()
        id.forEach((id)=>{
            let batchref=admin.firestore().collection("UserNode").doc(id)
            batch.update(batchref,{status:"0"})           
        })
        await batch.commit()

        // let docRef=await admin.firestore().collection("UserNode").doc(id).update({status:"0"})
        res.send({message:"Deleted Successfully", status:true})
        
    } catch (error) {
        console.log(error)
        res.status(500).send({message:"somthing went wrong",status:false})
    }
}








const createBatch=async(req,res)=>{
    try {
        console.log(req.body)
        
        
        let status = ["1"];
        let reqdata=req.body
      
      

        let query = admin.firestore().collection("UserNode")
        .where('access', '==', 'App User')
        .where('status', 'in', status)
        if(reqdata.company){
            query=query.where("companyid","==",reqdata.company);
        }
        if(reqdata.city){
            query=query.where("city","in",reqdata.city)
        }
        // if(reqdata.country){
        //     query=query.where("country","==",reqdata.country)
        // }
        if(reqdata.role){
            query=query.where("role","in",reqdata.role)
        }
     
        if(reqdata.startdate){
            reqdata.startdate=moment(reqdata.startdate).startOf('day').format('YYYY-MM-DDTHH:mm:ss.SSS[Z]')
          
            query=query.where("joindate", ">=", reqdata.startdate)
        }
        
        if(reqdata.enddate){
        
            reqdata.To_Date=moment(reqdata.endate).endOf('day').format('YYYY-MM-DDTHH:mm:ss.SSS[Z]')
            console.log(reqdata.enddate)
            query=query.where("joindate", "<=", reqdata.enddate)
        }
        
        if(req.body.search){
            let searchTerm=req.body.search.toLowerCase()
            query = query.where("username", ">=", searchTerm)
                         .where("username", "<=", searchTerm + "\uf8ff");
        }
        
        const snapshot = await query.orderBy("createAt","desc").get()
            
            let data = [];
            // snapshot.forEach(doc => {
            //     data.push({_id: doc.id, ...doc.data()});
            // });
            for (const doc of snapshot.docs) {
                let existsSnapshot = await admin.firestore().collection("userbatch").where("userid", "==", doc.id).get();
                // console.log(existsSnapshot)
                if(existsSnapshot.empty){
                    data.push({ _id: doc.id, ...doc.data() });
                }
            }
            
           return  res.status(200).send({data,message: "Users fetched successfully",status: true});

    } catch (error) {
        console.log(error)
        res.status(500).send({message:"somthing went wrong",status:false})
    }
}

const batchCreatedAdd=async(req,res)=>{
    try {
               
        // console.log(req.body)
        const {selectedusers,batchdata}=req.body
        console.log(selectedusers)
        console.log(batchdata)
        batchdata.createDate=moment().format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
  
        
        batchdata.enddate=moment(batchdata.enddate).endOf('day').format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
        batchdata.createAt=firebbase.firestore.FieldValue.serverTimestamp()
            let companyShort = batchdata.company.slice(0, 2).toUpperCase();   
            // let cityShort = batchdata.city.slice(0, 2).toUpperCase();  
            // let teamShort = batchdata.team.slice(0, 2).toUpperCase();   
            // let roleShort = batchdata.role.slice(0, 2).toUpperCase();  
            let cityShort = batchdata.city.map(item => item.slice(0, 2)).join('').toUpperCase();  
            let teamShort = batchdata.team.map(item => item.slice(0, 2)).join('').toUpperCase();  
            let roleShort = batchdata.role.map(item => item.slice(0, 2)).join('').toUpperCase(); 
            // let todaydata = new Date().toISOString().slice(5, 10).replace(/-/g, '-');
            const today = new Date();
            const day = String(today.getDate()).padStart(2, '0');
            const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are zero-based
            const year = String(today.getFullYear()).slice(-2); // Last two digits of the year
            
            const formattedDate = `${day}-${month}-${year}`;
            console.log(formattedDate); // e.g., "02-08-24"
             let shortname = `${companyShort}-${cityShort}-${teamShort}-${roleShort}-${formattedDate}`;
             batchdata.name=shortname
             batchdata.shortname=shortname
             batchdata.slugname=shortname.toLowerCase()
            let bathref=await admin.firestore().collection('batch').add(batchdata)
            let companyRef=await admin.firestore().collection("UserNode").doc(batchdata.companyid)
            await companyRef.update({
                batchcount:firebbase.firestore.FieldValue.increment(1)
            })
            let idofBatch=bathref.id
            console.log(idofBatch)
            let count=0
            let userIds=selectedusers.map(x => x._id);
            // await bathref.update({_id: idofBatch});
            let batchPromises = userIds.map(async (id,index) => {
                let userBatchSnapshot = await admin.firestore().collection("userbatch")
                .where("userid", "==", id)
                .get();
              
            
            if (userBatchSnapshot.empty) {
                count++
                let userBatchRef = await admin.firestore().collection("userbatch").add({userid: id, batchid: idofBatch,companyid:batchdata.companyid,userdata:selectedusers[index]});
                await userBatchRef.update({_id: userBatchRef.id});
            }

            });
            // Wait for all batchPromises to resolve
            await Promise.all(batchPromises);
            // console.log("here")
            console.log(count)
            await bathref.update({_id: idofBatch,usercount:count});
            console.log("-------------------")

            res.send({message: "Batch created", status: true});

        
    } catch (error) {
        console.log(error)
        res.status(500).send({message:"somthing went wrong",status:false})
    }
}

const editBatch=async(req,res)=>{
    try {
        let data=req.body
        let batchRef=admin.firestore().collection("batch").doc(data._id)
        batchRef.update(data)
        res.status(200).send({message:"Updated Successfully",status:true    })
    } catch (error) {
        console.log(error)
        res.status(500).send({message:"somthing went wrong ",status:false})
    }
}
const bacthnewUserList =async(req,res)=>{
    try {
        console.log(req.body)
        let status = ["1"];
        let reqdata=req.body
        let query = admin.firestore().collection("UserNode")
        .where('access', '==', 'App User')
        .where('status', 'in', status)
        if(reqdata.company){
            query=query.where("companyid","==",reqdata.company);
        }
        if(reqdata.city){
            query=query.where("city","in",reqdata.city)
        }
       
        if(reqdata.role){
            query=query.where("role","in",reqdata.role)
        }
     
        if(reqdata.startdate){
            reqdata.startdate=moment(reqdata.startdate).startOf('day').format('YYYY-MM-DDTHH:mm:ss.SSS[Z]')
          
            query=query.where("joindate", ">=", reqdata.startdate)
        }
        
        if(reqdata.enddate){
            console.log("hi  here")
            reqdata.To_Date=moment(reqdata.endate).endOf('day').format('YYYY-MM-DDTHH:mm:ss.SSS[Z]')
            console.log(reqdata.enddate)
            query=query.where("joindate", "<=", reqdata.enddate)
        }    
        const snapshot = await query.orderBy("createAt","desc").get()
            
            let data = [];
            for (const doc of snapshot.docs) {
                let existsSnapshot = await admin.firestore().collection("userbatch").where("userid", "==", doc.id).get();
              
                if(existsSnapshot.empty){
                    data.push({ _id: doc.id, ...doc.data() });
                }
            }   
            console.log(data)
           return  res.status(200).send({data,message: "Users fetched successfully",status: true});


    } catch (error) {
        console.log(error)
        res.status(500).send({message:"somthing went worng ",status:false})
    }
}

const addUsertoBatch=async(req,res)=>{
    try {
        console.log(req.body)
        let {selectedUsers,batchid,company}=req.body
     
        let count=0
        let userIds=selectedUsers.map(x => x._id);
        let batchPromises = userIds.map(async (id,index) => {
            let userBatchSnapshot = await admin.firestore().collection("userbatch")
            .where("userid", "==", id)
            .get();
          
        
        if (userBatchSnapshot.empty) {
            count++
            let userBatchRef = await admin.firestore().collection("userbatch").add({userid: id, batchid: batchid,companyid:company,userdata:selectedUsers[index]});
            await userBatchRef.update({_id: userBatchRef.id});
        }

        });
       
        await Promise.all(batchPromises);
        console.log(count)
        
        let batchRef=await  admin.firestore().collection("batch").doc(batchid)
        batchRef.update({usercount:firebbase.firestore.FieldValue.increment(count)})

        res.send({message:"User added  successfully",status:true})

    } catch (error) {
        console.log(error)
        res.status(500).send({message:"somthing wetn wrong",status:false})
    }
}




const shiftBathlist=async(req,res)=>{
    try{
        console.log(req.body)
        const filters = req.body
        let bathreQuery = admin.firestore().collection("batch").where("companyid", "==", filters.company);
        
        if (filters.From_Date) {
            filters.From_Date = moment(filters.startdata).startOf('day').format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
            bathreQuery = bathreQuery.where("startdate", ">=", filters.From_Date);
        }
        
        if (filters.To_Date) {
            filters.To_Date = moment(filters.To_Date).endOf('day').format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
            bathreQuery = bathreQuery.where("startdate", "<=", filters.enddate);
        }
        
        if (req.body.search) {
            let searchTerm = req.body.search;
            bathreQuery = bathreQuery.where("slugname", ">=", searchTerm)
                                     .where("slugname", "<=", searchTerm + "\uf8ff");
        }
        
      
        
        try {
            const baseSnapshot = await bathreQuery.get();
            let baseData = [];
            baseSnapshot.forEach(doc => {
                baseData.push({_id: doc.id, ...doc.data()});
            });
        
          
        
            // Apply additional filtering for 'City'
            let filteredData = baseData;
        
            if (Array.isArray(filters.city) && filters.city.length > 0) {
                filteredData = filteredData.filter(doc => {
                    const matches = doc.city && doc.city.some(city => filters.city.includes(city));
                    console.log(`Filtering by city: ${filters.city}, Document city: ${doc.city}, Matches: ${matches}`);
                    return matches;
                });
        
              
            }
        
            // Apply additional filtering for 'Role'
            if (Array.isArray(filters.role) && filters.role.length > 0) {
                filteredData = filteredData.filter(doc => {
                    const matches = doc.role && doc.role.some(role => filters.role.includes(role));
                    console.log(`Filtering by role: ${filters.Role}, Document role: ${doc.role}, Matches: ${matches}`);
                    return matches;
                });
        
              
            }
        
        
            // const count = filteredData.length;
            console.log(filteredData)   
            let batchdata=filteredData.filter((x)=>x._id!==req.body.batchid)
            const count = batchdata.length;
            if(batchdata.length>0){
             
                batchdata = batchdata.slice(req.body.skip,req.body.limit);
                
            }
          console.log(batchdata)
            res.send({ message: "batchlist", count: count, status: true, data: batchdata });
        } catch (error) {
            console.error('Error retrieving data:', error);
            res.status(500).send({ message: "Error retrieving data", status: false });
        }
    }catch(error){
        console.log(error)
        res.status(500).send({message:"somthing went wrong",status:false})
    }
}

const shiftBatch=async(req,res)=>{//for shifting the uer form one batch to another
    try {
        console.log(req.body)

    let {userData,shiftingbatch,currentbatchid}=req.body
    console.log(userData)
    let count=userData.length
    console.log('++++++++++++++++++++++++++++++++++++++++++++++++')

    console.log(currentbatchid)
    // console.log(shiftingbatch)
    let shifitingbatchid=shiftingbatch._id
    console.log(shifitingbatchid)
    for (let i = 0; i < userData.length; i++) {
        let batchuserRef = await admin.firestore().collection("userbatch").where('userid', '==', userData[i]._id).get();
        
        batchuserRef.forEach(async (doc) => {
            await doc.ref.update({ batchid: shifitingbatchid });
        });
    }

    let currentbatch=await admin.firestore().collection("batch").doc(currentbatchid)
    currentbatch.update({usercount:firebbase.firestore.FieldValue.increment(-count)})
    let shifitingbatch=await admin.firestore().collection("batch").doc(shifitingbatchid).update({usercount:firebbase.firestore.FieldValue.increment(count)})

    res.status(200).send({message:"Shifted successfully",status:true})

    } catch (error) {
        console.log(error)
        res.status(500).send({message:"somthing went wrong",status:false})
    }
}


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
    addUserToBatch,
    deletedUserslist,
    permanentDeleteUser,
    restoreUser,
    addeditTrainer,
    trainersList,
    updateTrainerStatus,
    deleteTrainer,
    batchCompanyList,
    // smtpSetting,
    // smtpSave,
    companyDelete,
    createBatch,
    batchCreatedAdd,
    editBatch,
    bacthnewUserList,
    addUsertoBatch,
    shiftBathlist
    
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
        