const { admin } = require("../config/firebaseConfig");

async function pushNotification(data) {
    try {
        // Fetch users with valid FCM keys and active status
        const userDatas = await admin.firestore()
            .collection("UserNode")
            .where("fcmKey", "!=", null)
            .where("status", "==", "1")
            .get();

        let user = [];
        if (!userDatas.empty) {
            userDatas.forEach(doc => {
                user.push({ _id: doc.id, ...doc.data() });
            });
        }

        const fcmtokens = user.map(x => x.fcmKey);

        if (fcmtokens.length === 0) {
            console.log("No FCM tokens found.");
            return; // Exit early if there are no tokens
        }

        // Function to split array into chunks
        const chunkArray = (array, size) => {
            const result = [];
            for (let i = 0; i < array.length; i += size) {
                result.push(array.slice(i, i + size));
            }
            return result;
        };

        const chunkedTokens = chunkArray(fcmtokens, 500);
        const message = {
            notification: {
                title: data.title || "Notification Title",
                body: data.message || "Notification Body"
            }
        };

        // Send messages in chunks
        const sendMessages = async () => {
            for (const tokensChunk of chunkedTokens) {
                try {
                    const response = await admin.messaging().sendMulticast({ ...message, tokens: tokensChunk });
                    // console.log(`${response.successCount} messages were sent successfully`);
                    // console.log(`${response.failureCount} messages failed`);
                } catch (error) {
                    console.error('Error sending message:', error);
                }
            }
        };

        await sendMessages();
        console.log('All messages have been sent.');

    } catch (error) {
        console.error('Error fetching user data:', error);
    }
}


// const {admin}=require("../config/firebaseConfig")



// async function pushNotification(data){



//     let userDatas=await admin.firestore().collection("UserNode").where("fcmKey","!=",null).where("status","==","1").get()
//     let user=[]
//     if(!userDatas.empty){
        
//         userDatas.forEach(doc => {
//             user.push({ _id: doc.id, ...doc.data() });
//         });
//     }

//     let fcmtokens=user.map(x=>x.fcmKey)

//     const chunkArray = (array, size) => {
//         const result = [];
//         for (let i = 0; i < array.length; i += size) {
//           result.push(array.slice(i, i + size));
//         }
//         return result;
//       };
      
//       const chunkedTokens = chunkArray(fcmtokens, 500);
//   const message = {
//         notification: {
//           title: data.title || "Notification Title",
//           body: data.message || "Notification Body"
//         },
       
//       };
//       chunkedTokens.forEach(tokensChunk => {
//         admin.messaging().sendMulticast({ ...message, tokens: tokensChunk })
//           .then(response => {
//             console.log(response.successCount + ' messages were sent successfully');
//             console.log(response.failureCount + ' messages failed');
//           })
//           .catch(error => {
//             console.error('Error sending message:', error);
//           });
//       });

// }




module.exports={
    pushNotification
}
