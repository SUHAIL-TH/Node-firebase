const admin = require("firebase-admin")
// const firebase=require('firebase')
const serviceAccount = require('../serviceAccountKey.json');
const { merge } = require("../routes/admin");


admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})

//**************************************************************************************** Admin ********************************************************************************************* */

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


const getUsers = (req, res) => {// for getting list of users
    try {
        let data = []
        admin.firestore().collection('UserNode').where('access', '==', 'App User').get()
            .then(snapshot => {
                snapshot.forEach(doc => {
                    // console.log(doc.id)
                    data.push(doc.data())
                });
                res.send({ message: "user details", data: data, status: true })
            })
            .catch(err => {
                console.log('Error getting documents', err);
                res.status(500).json({ message: "Internal server error", status: false });
            });
    } catch (error) {
        console.log(error)
        res.status(500).send({ message: "Somthing went wrong", status: false })
    }
}


const subAdminslist = async(req, res) => {// for to get subadmin list from firestore  
    try {
        let data = [];
        const collectionRef = admin.firestore().collection('subAdmins');
        let query = collectionRef.where("access", "==", "subAdmin");
        
        if (req.body.search) {
            query = query.where("name", "==", req.body.search);
        }
        const snapshotCount = await query.get();
        const count = snapshotCount.size;
        query = query.limit(req.body.limit).offset(req.body.skip);
        // Execute the query
        query.get()
            .then(snapshot => {
                snapshot.forEach(doc => {
                    data.push(doc.data());
                });
                res.send({ message: "sub admin list", data: data, status: true, count: count });
            })
            .catch(error => {
                console.error("Error fetching documents:", error);
                res.status(500).send({ message: "Internal Server Error", status: false });
            });
        // admin.firestore().collection("subAdmins").where("access", "==", "subAdmin").get()
        //     .then(snapshot => {
        //         snapshot.forEach(doc => {
        //             data.push(doc.data())
        //         })
        //         res.send({ message: "sub admin list", data: data, status: true })
        //     })
    } catch (error) {
        console.log(error);
        res.status(500).send({ message: "Somthing went wrong", status: false })
    }
}



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
            const snapshot = await admin.firestore().collection("subAdmins").where("_id", "==", data._id).get();
            if (!snapshot.empty) {
                const updatePromises = snapshot.docs.map(doc =>
                    admin.firestore().collection("subAdmins").doc(doc.id).update(data)
                );
                await Promise.all(updatePromises);
                res.status(200).send({ message: "Sub admin updated successfully", status: true });
            } else {
                res.status.send({ message: "No subadmin   data is not founded", status: false });
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
        // console.log(doc.id)
        // console.log(docData);
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


const deleteSubAdmin=async(req,res)=>{ // for deleting the subadmin
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

const companyList=async(req,res)=>{// for getting the company list
    try {
        let data=[]
        let collectionRef=admin.firestore().collection("companies")
        if(req.body.search){
            console.log(req.body.search);
            collectionRef=collectionRef.where("name","==",req.body.search)
        }
        let snapshotCount=await collectionRef.get()
        let count=snapshotCount.size;
        collectionRef=collectionRef.limit(req.body.limit).offset(req.body.skip)
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

const addeditcompany = async (req, res) => { //for adding companies
    try {
        let data = req.body;
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
        await admin.firestore().collection("companies").doc(id).set({ ...data, _id: id }, { merge: true }).then((res)).then((result)=>{
            res.status(200).send({ message: "Company added", status: true, });
        })
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Something went wrong", status: false });
    }
};

const companyDelete=async(req,res)=>{
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

const getCompany=async(req,res)=>{
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



/***********************************************************************************************************************************************************************************************/

module.exports = {
    getUsers,
    postLogin,
    roleCheck,
    subAdminslist,
    createUpdateSubAdmin,
    getSubadmin,
    deleteSubAdmin,
    companyList,
    addeditcompany,
    companyDelete,
    getCompany

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