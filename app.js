const express =require("express")
const app=express()
const cors=require("cors")
const adminRoutes=require("./routes/admin")
const dbconnect=require("./config/config")
const morgan=require("morgan")

dbconnect.dbconnect()
app.use(cors({
    credentials:true,
    origin:['http://localhost:4200','http://localhost:4000','http://localhost:4201',"http://localhost:3700","http://192.168.1.45:4200"]
}))
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use((req, res, next) => {
  res.header("Cache-Control", "no-cache,  no-store, must-revalidate");
  next();
});
app.use("/public/images",express.static(__dirname+"public/images"))  

// app.use(morgan("dev"))
app.use("/",adminRoutes)

app.listen(4000,()=>{
    console.log("server started to listing port 4000")
})