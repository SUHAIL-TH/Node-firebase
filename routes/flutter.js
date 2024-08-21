const express=require("express")
const flutterRoutes=express()
const fluttterController=require("../controller/flutterController")


flutterRoutes.post("/notificationlist",fluttterController.notificationList)
flutterRoutes.post("/startpratice",fluttterController.startPractice)
flutterRoutes.post("/endpractice",fluttterController.endPractice)

// pronunciaton lab report

flutterRoutes.post("/pronunciationlabreports",fluttterController.pronunciationLabReport)
flutterRoutes.post("/pronuniciationlabreportlist",fluttterController.pronunciationLabReportlist)
flutterRoutes.post("/prouseroveralldata",fluttterController.proUserOverAll)
flutterRoutes.post("/prouserperdayresult",fluttterController.proUserperDay)
flutterRoutes.post("/proreportperword",fluttterController.proReportperWord)

// speech lab report

flutterRoutes.post("/speechlabreportsadd",fluttterController.speechlabReports)

module.exports=flutterRoutes