

const transporter=require("../config/mailConfig")
let {admin}=require("../config/firebaseConfig")
const moment=require("moment")

const emailTemplateSchema = require("../model/email_template")


async function subscriptionrenewal30days(){
    try {
        let transporterdata=await transporter.getTransported()
        console.log(transporterdata)
        const thirtyDaysBack = moment().add(30, 'days');
        let startdata = thirtyDaysBack.startOf("day").format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
        let enddate = thirtyDaysBack.endOf("day").format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
        
        // Firestore query
        let snapshot = await admin.firestore().collection("UserNode")
          .where("access", "==", "company")
          .where("subscriptionenddate", ">=", startdata)
          .where("subscriptionenddate", "<=", enddate)
          .get();
          
        if (snapshot.empty) {
    
          return;
        }
    
        let subscriptionEndingCompany = [];
        snapshot.forEach(doc => {
          subscriptionEndingCompany.push(doc.data());
        });
        let emailtemplate=await emailTemplateSchema.findOne({_id:"66b5acec065a017fd64a3398",status:1})
        
    
        if(subscriptionEndingCompany.length>0){
            
            for(let i=0;i<subscriptionEndingCompany.length;i++){
                let html=emailtemplate.email_content
    
    
                html= html.replace('{{name}}',subscriptionEndingCompany[i].name)
                html=  html.replace('{{companyname}}',subscriptionEndingCompany[i].companyname)
                let date = subscriptionEndingCompany[i].subscriptionenddate.split('T')[0];
                html=   html.replace('{{subscriptionenddate}}',date)
                let mailOptions = {
                    from:emailtemplate.sender_email , 
                    to: subscriptionEndingCompany[i].email, 
                    subject: emailtemplate.email_subject,
                    html:html 
                };
                let info = await transporterdata.sendMail(mailOptions);
            }
        }
        // else{
        //     console.log("here mr suhail")
        //     let mailOptions = {
        //         from:"thiagarajan@teamtweaks.com", // Sender address
        //         to:"suhailth17756@gmail.com", // List of recipients
        //         subject: "somthing went worng", // Subject line
        //         // text: "Hello world!", // Plain text body
        //         html:`<h1>hii</h6>` // HTML body
        //     };
     
                
        //         let info = await transporterdata.sendMail(mailOptions);
       
            
    
        // }
    } catch (error) {
        console.log(error)
    }
   
    
    

}

async function subscriptionrenewal15days(){

    try {
        let transporterdata=await transporter.getTransported()
        // console.log(transporterdata)
        const thirtyDaysBack = moment().add(15, 'days');
        let startdata = thirtyDaysBack.startOf("day").format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
        let enddate = thirtyDaysBack.endOf("day").format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
        console.log(startdata)
        // Firestore query
        let snapshot = await admin.firestore().collection("UserNode")
          .where("access", "==", "company")
          .where("subscriptionenddate", ">=", startdata)
          .where("subscriptionenddate", "<=", enddate)
          .get();
          
        if (snapshot.empty) {
          console.log("No matching documents found.");
          return;
        }
    
        let subscriptionEndingCompany = [];
        snapshot.forEach(doc => {
          subscriptionEndingCompany.push(doc.data());
        });
        console.log(subscriptionEndingCompany)
        let emailtemplate=await emailTemplateSchema.findOne({_id:"66b9bc8c3bdff51274bc4cc1",status:1})
        
    
        if(subscriptionEndingCompany.length>0){
            
            for(let i=0;i<subscriptionEndingCompany.length;i++){
                let html=emailtemplate.email_content
    
    
              
                html= html.replace('{{name}}',subscriptionEndingCompany[i].name)
                html=  html.replace('{{companyname}}',subscriptionEndingCompany[i].companyname)
                let date = subscriptionEndingCompany[i].subscriptionenddate.split('T')[0];
                html=   html.replace('{{subscriptionenddate}}',date)
                let mailOptions = {
                    from:emailtemplate.sender_email , 
                    to: subscriptionEndingCompany[i].email, 
                    subject: emailtemplate.email_subject,
                    html:html 
                };
                let info = await transporterdata.sendMail(mailOptions);
            }
            
            // let info = await transporterdata.sendMail(mailOptions);
        }
        
        // }
    } catch (error) {
        console.log(error)
    }
   
    


}

async function subscriptionrenewal5days(){
    try {
        let transporterdata=await transporter.getTransported()
        
        const thirtyDaysBack = moment().add(5, 'days');
        let startdata = thirtyDaysBack.startOf("day").format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
        let enddate = thirtyDaysBack.endOf("day").format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
        console.log(startdata)
        
        // Firestore query
        let snapshot = await admin.firestore().collection("UserNode")
          .where("access", "==", "company")
          .where("subscriptionenddate", ">=", startdata)
          .where("subscriptionenddate", "<=", enddate)
          .get();
          
        //   console.log(startdata)
        if (snapshot.empty) {
          console.log("No matching documents found.");
          return;
        }
    
        let subscriptionEndingCompany = [];
        snapshot.forEach(doc => {
          subscriptionEndingCompany.push(doc.data());
        });
        let emailtemplate=await emailTemplateSchema.findOne({_id:"66b9bca33bdff51274bc4cc3",status:1})
       
        // console.log(subscriptionEndingCompany)
    
        if(subscriptionEndingCompany.length>0){
            
            for(let i=0;i<subscriptionEndingCompany.length;i++){
                let html=emailtemplate.email_content
    
   
                html= html.replace('{{name}}',subscriptionEndingCompany[i].name)
                html=  html.replace('{{companyname}}',subscriptionEndingCompany[i].companyname)
                let date = subscriptionEndingCompany[i].subscriptionenddate.split('T')[0];
                html=   html.replace('{{subscriptionenddate}}',date)
                let mailOptions = {
                    from:emailtemplate.sender_email , 
                    to: subscriptionEndingCompany[i].email, 
                    subject: emailtemplate.email_subject,
                    html:html 
                };
                let info = await transporterdata.sendMail(mailOptions);
          
            }
            
        }
    
    } catch (error) {
        console.log(error)
    }
   
    
}

async function subscriptionexperied(){
    try {
        let transporterdata=await transporter.getTransported()
        
        const thirtyDaysBack = moment().subtract(10, 'days');
        let startdata = thirtyDaysBack.startOf("day").format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
        let enddate = thirtyDaysBack.endOf("day").format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
        
        // Firestore query
        let snapshot = await admin.firestore().collection("UserNode")
          .where("access", "==", "company")
          .where("subscriptionenddate", ">=", startdata)
          .where("subscriptionenddate", "<=", enddate)
          .get();
          
        //   console.log(startdata)
        if (snapshot.empty) {
          console.log("No matching documents found.");
          return;
        }
    
        let subscriptionEndingCompany = [];
        snapshot.forEach(doc => {
          subscriptionEndingCompany.push(doc.data());
        });
        let emailtemplate=await emailTemplateSchema.findOne({_id:"66b5ae98065a017fd64a339a",status:1})
       
        // console.log(subscriptionEndingCompany)
    
        if(subscriptionEndingCompany.length>0){
            
            for(let i=0;i<subscriptionEndingCompany.length;i++){
                let html=emailtemplate.email_content
    
   
                html= html.replace('{{name}}',subscriptionEndingCompany[i].name)
                html=  html.replace('{{companyname}}',subscriptionEndingCompany[i].companyname)
                let date = subscriptionEndingCompany[i].subscriptionenddate.split('T')[0];
                html=   html.replace('{{subscriptionenddate}}',date)
                let mailOptions = {
                    from:emailtemplate.sender_email , 
                    to: subscriptionEndingCompany[i].email, 
                    subject: emailtemplate.email_subject,
                    html:html 
                };
                let info = await transporterdata.sendMail(mailOptions);
          
            }
            
        }
    
    } catch (error) {
        console.log(error)
    }
   
    
}


module.exports={
    subscriptionrenewal30days,
    subscriptionrenewal15days,
    subscriptionrenewal5days,
    subscriptionexperied
}


