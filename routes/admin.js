const express=require("express")

const adminRouter=express()
const adminController=require("../controller/adminController")
/****************************************************Admin routes */

// adminRouter.post("/login",adminController.postLogin)
adminRouter.post("/role_check",adminController.roleCheck)

adminRouter.get("/get_users",adminController.getUsers)

adminRouter.post("/getsubadmin",adminController.subAdminslist)
adminRouter.post("/addsubadmin",adminController.createUpdateSubAdmin)
adminRouter.post("/editsubadmin",adminController.getSubadmin)
adminRouter.post("/deletesubadmin",adminController.deleteSubAdmin)


adminRouter.post("/companeylist",adminController.companyList)
adminRouter.post("/addeditcompany",adminController.addeditcompany)
adminRouter.post("/deletecompany",adminController.companyDelete)
adminRouter.post("/getcompany",adminController.getCompany)
adminRouter.post("/updatecompanystatus",adminController.companyStatus)

module.exports=adminRouter
