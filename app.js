// const express =require("express")
// const app=express()
// const cors=require("cors")
// const adminRoutes=require("./routes/admin")
// const flutterRoutes=rquire
// const dbconnect=require("./config/config")
// const morgan=require("morgan")
// const dotenv=require("dotenv")
// dotenv.config()

// dbconnect.dbconnect()
// app.use(cors({
//     credentials:true,
//     origin:'*'
// }))
// app.use(express.json())
// app.use(express.urlencoded({extended:true}))
// app.use((req, res, next) => {
//   res.header("Cache-Control", "no-cache,  no-store, must-revalidate");
//   next();
// });
// app.use("/public/images",express.static(__dirname+"public/images"))  

// // app.use('/*',express.static(__dirname,"dist/admin"))

// app.use(morgan("dev"))
// app.use("/",adminRoutes)
// app.use("/v1",appRoutes)

// app.listen(4000,()=>{
//     console.log("server started to listing port 4000")
// })
const express =require("express")
const  http=require("http")
const socketIo = require('socket.io');
const app=express()
const server = http.createServer(app);
const io = socketIo(server);
const cors=require("cors")
const adminRoutes=require("./routes/admin")
const appRoutes=require("./routes/flutter")
const dbconnect=require("./config/config")
const cron=require("node-cron")
const moment=require("moment-timezone")
const morgan=require("morgan")
const dotenv=require("dotenv")
const path = require("path")
const subscriptioncron=require("./cron/subscriptioncron")
dotenv.config()

dbconnect.dbconnect()
app.use(cors({
    credentials:true,
    origin:'*'
}))


io.on('connection', (socket) => {
  // console.log('a user connected');
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});


// cron.schedule('* * * * *', () => {
//   console.log("here i have reached----++++")
//   const istDate = moment.tz(new Date(), "Asia/Kolkata").format('YYYY-MM-DD HH:mm:ss');
//   const indianTime = moment().tz("Asia/Kolkata").format('YYYY-MM-DD HH:mm:ss');
//   console.log(indianTime);
//   console.log("why the time zone is not printing here")
//   subscriptioncron.subscriptionrenewal5days();

// });

//this is for the cron job for running for sending the mail 
cron.schedule('0 7 * * *', async () => {
  // subscriptioncron.subscriptionrenewal30days();
});
cron.schedule('0 8 * * *', async () => {
  // subscriptioncron.subscriptionrenewal5days();
});
cron.schedule('0 9 * * *', async () => {
  // subscriptioncron.subscriptionrenewal15days();
});
cron.schedule('0 6 * * *', async () => {
  // subscriptioncron.subscriptionexperied()
});
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use((req, res, next) => {
  res.header("Cache-Control", "no-cache,  no-store, must-revalidate");
  next();
});
app.use("/public/images",express.static(__dirname+"public/images"))  

app.use(morgan("dev"))
app.use("/",adminRoutes)
app.use("/v1",appRoutes)

app.use('/', express.static(path.join(__dirname, 'dist')));

app.get('/*', function (req, res) {
  return res.sendFile(path.join(__dirname, 'dist/admin', 'index.html'), { acceptRanges: false });
})




server.listen(process.env.PORT,()=>{
    console.log("server started to listing port 4000")
})

process.on('SIGINT', () => {
  console.log("SIGINT signal received: closing HTTP server");
  server.close(() => {
      console.log("HTTP server closed");
      dbconnect.dbdisconnect();  // Close MongoDB connection
      process.exit(0);  // Exit the process after disconnecting
  });
});

process.on('SIGTERM', () => {
  console.log("SIGTERM signal received: closing HTTP server");
  server.close(() => {
      console.log("HTTP server closed");
      dbconnect.dbdisconnect();  // Close MongoDB connection
      process.exit(0);  // Exit the process after disconnecting
  });
});