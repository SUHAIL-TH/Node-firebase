const admin = require("firebase-admin")
// const firebase=require('firebase')
const serviceAccount = require('../serviceAccountKey.json');
const { getRounds } = require("bcrypt");
const { doc } = require("firebase/firestore");


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
        let collectionRef=admin.firestore().collection("companies")
        if(req.body.search){
            console.log(req.body.search);
            collectionRef=collectionRef.where("name","==",req.body.search)
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


const companyDelete = async (req,res)=>{//for deleting the company
    try {
        let id=req.body.ids[0]
        if(id){
            let docRef = admin.firestore().collection("companies").doc(id)
            await docRef.delete()
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
        let query = admin.firestore().collection("UserNode").where('access', '==', 'App User');
        
        if (req.body.search) {
            console.log(req.body.search)
            query = query.where("username", "==", req.body.search);
        }
        const count = (await query.get()).size
        
        const snapshot = await query.offset(req.body.skip).limit(req.body.limit).get();
        let data = [];
        snapshot.forEach((doc) => {
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
        admin.firestore().collection("companies").where("status","==",1).get().then((snapshot)=>{
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


const addedituser=async(req,res)=>{//for adding users
    console.log(req.body)
    try {
        let actiontype=req.body.actiontype
        delete req.body.actiontype
        let data=req.body
        data.access="App User"
        if(actiontype==="create"){
            // console.log("inside");
            data.createAt=admin.firestore.FieldValue.serverTimestamp()
            admin.firestore().collection("UserNode").add(data)
            .then((dodRef)=>{
                return dodRef.update({_id:dodRef.id})
            }).then((result)=>{
                // console.log("documetn added successfully")
                res.send({message:"user added successfully",status:true})
            }).catch((error)=>{
                console.log(error);
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
    companyDelete,
    getCompany,
    companyStatus,
    getcompanynames,
    addedituser,
    getuserDetails,
    userStatus,
    deleteUser


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

            //////////////////////////////////////////////////////////////////////////////update methode another way
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