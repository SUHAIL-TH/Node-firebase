const express=require("express")
const adminRouter=express()
const adminController=require("../controller/adminController")
const { upload } = require("../middleware/multer");
const companyController=require("../controller/companyController");
    



/****************************************************Admin routes */

// adminRouter.post("/login",adminController.postLogin)
adminRouter.post("/role_check",adminController.roleCheck)


adminRouter.post("/getsubadmin",adminController.subAdminslist)
adminRouter.post("/addsubadmin",adminController.createUpdateSubAdmin)
adminRouter.post("/editsubadmin",adminController.getSubadmin)
adminRouter.post("/deletesubadmin",adminController.deleteSubAdmin)
adminRouter.post("/permanentdeleteuser",adminController.permanentDeleteUser)
adminRouter.post("/restoreuser",adminController.restoreUser)


adminRouter.post("/companeylist",adminController.companyList)
adminRouter.post("/addeditcompany",adminController.addeditcompany)
adminRouter.post("/deletecompany",adminController.company_subadmin_Delete)
adminRouter.post("/getcompany",adminController.getCompany)
adminRouter.post("/updatecompanystatus",adminController.companyStatus)
adminRouter.get("/getcompnaynames",adminController.getcompanynames)
adminRouter.post("/addcompnaysubadmin",adminController.addcompanySubadmin)
adminRouter.post("/companysubadminlist",adminController.companySubadminList)


adminRouter.post("/get_users",adminController.getUsersList)
adminRouter.post("/addedituser",adminController.addedituser)
adminRouter.post('/getuserdetail',adminController.getuserDetails)
adminRouter.post("/updateuserstatus",adminController.userStatus)
adminRouter.post("/users/delete",adminController.deleteUser)
adminRouter.post('/bluckuploaduser', upload.single('file'),adminController.bulkuploaduser)

adminRouter.post("/batchaddedit",adminController.addeditBatch)
adminRouter.post("/batchlist",adminController.getbatchlist)
adminRouter.post("/batchstatus",adminController.batchStatus)
adminRouter.post("/getbatchdetails",adminController.getBatchDetails)
adminRouter.post("/batchusers",adminController.batchUsers)
adminRouter.post("/deletebathuser",adminController.deletebathuser)
adminRouter.post("/changebatchlist",adminController.chagneBatchList)
adminRouter.post("/shiftbatch",adminController.shiftBatch)

adminRouter.post("/profiledetails",adminController.profileData)
adminRouter.post("/updateprofile",adminController.updateprofile)
adminRouter.post("/batchadduserlist",adminController.adduserbatchlist)
adminRouter.post("/addusertobatch",adminController.addUserToBatch)
adminRouter.get('/deleteduserslist',adminController.deletedUserslist)

// **********************************************************************************************Company admin apies

adminRouter.post("/company/userslist",companyController.comUserList)
adminRouter.post("/company/adduser",companyController.comAddEditUser)
adminRouter.post("/company/bulkuserupload", upload.single('file'),companyController.comBulkUserUpload)
adminRouter.post("/company/addbatch",companyController.addeditBatch)


//*******************************************************************************common routes for company and admin */

module.exports=adminRouter
