const express=require("express")

const adminRouter=express()
const adminController=require("../controller/adminController")
const { upload } = require("../middleware/multer");
/****************************************************Admin routes */

// adminRouter.post("/login",adminController.postLogin)
adminRouter.post("/role_check",adminController.roleCheck)


adminRouter.post("/getsubadmin",adminController.subAdminslist)
adminRouter.post("/addsubadmin",adminController.createUpdateSubAdmin)
adminRouter.post("/editsubadmin",adminController.getSubadmin)
adminRouter.post("/deletesubadmin",adminController.deleteSubAdmin)


adminRouter.post("/companeylist",adminController.companyList)
adminRouter.post("/addeditcompany",adminController.addeditcompany)
adminRouter.post("/deletecompany",adminController.companyDelete)
adminRouter.post("/getcompany",adminController.getCompany)
adminRouter.post("/updatecompanystatus",adminController.companyStatus)
adminRouter.get("/getcompnaynames",adminController.getcompanynames)
adminRouter.post("/compnaysubadmin",adminController.addcompanySubadmin)


adminRouter.post("/get_users",adminController.getUsersList)
adminRouter.post("/addedituser",adminController.addedituser)
adminRouter.post('/getuserdetail',adminController.getuserDetails)
adminRouter.post("/updateuserstatus",adminController.userStatus)
adminRouter.post("/users/delete",adminController.deleteUser)
adminRouter.post('/bluckuploaduser', upload.single('file'),adminController.bulkuploaduser)


module.exports=adminRouter
