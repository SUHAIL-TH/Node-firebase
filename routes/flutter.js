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
flutterRoutes.post("/speechlabreportlist",fluttterController.speechlabReportList)
flutterRoutes.post("/senteceslabuseroverall",fluttterController.senteceslabOverallData)
flutterRoutes.post("/sentecesperdayresult",fluttterController.sentecesPerDay)
flutterRoutes.post("/senteceslabreportforsentences",fluttterController.sentencesReportperSentences)

flutterRoutes.post("/speechlabsenariodropdown",fluttterController.speechlabsenariodropdown)
flutterRoutes.post("/speechlabreportmainload",fluttterController.speechlabreportMainLoad)


// sms gateway for sending the otp
flutterRoutes.post("/sendopt",fluttterController.sendOtp)
flutterRoutes.post("/verifyotp",fluttterController.verifyOtp)


flutterRoutes.post('/sentecesandcallflowgraph',fluttterController.sentecesflowlabgraph)

module.exports=flutterRoutes