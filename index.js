const express = require("express");
const app = express();
const http = require("http")
const path = require("path");
const fs = require("fs")
const socketio = require("socket.io")
const cors = require("cors"); 
const UAParser = require("ua-parser-js");
app.use(cors());
const PORT = process.env.PORT || 4000;



const server = http.createServer(app);
const io = socketio(server);
app.use(cors());

app.get("/",(req,resp)=>{
  console.log("enter to / route")
  const userAagent = req.get("User-Agent")
  try{
    const parser = new UAParser();
    const result = parser.setUA(userAagent).getResult();
    const deviceType = result.device.type || "desktop";
    
    console.log("this is device type = ",deviceType)
  }catch(error){
        console.log("errror into getting device type.")
  }
  
  
  try{
    console.log(userAagent,"this is user agent")
    console.log(req.ip,"this is ip addreess")
      
  }catch(error){

      console.log("error to get userAgent and ip address");
    }
 


    resp.sendFile(path.join(__dirname,"public","about.html"))
})

app.get("/about",(req,resp)=>{
  console.log("enter into about route")
  resp.sendFile(path.join(__dirname,"public","index.html"))
})



app.use(express.static(path.join(__dirname,"public")))
const userlist =  new Set();
io.on("connection",(socket)=>{
    console.log("a user is connected and the socket id is",socket.id);
    
    userlist.add(socket.id);
    socket.emit("myid",socket.id);
    io.emit("userlist",Array.from(userlist));
  
    //outgoing call handling
   socket.on("outgoingcall", data =>{
    const {fromoffer,to} = data;
    console.log("enter into outgoincall..")
    userlist.delete(to);
    userlist.delete(socket.id);
    io.emit("userlist",Array.from(userlist));
    socket.to(to).emit("incommingcall",{from:socket.id,offer:fromoffer})
   })
  
   // callaccepted ..
   socket.on("callaccepted", data =>{
    console.log(`${socket.id} is accepted the call from ${data.to} and answering`)
     const {answer,to} = data;
     
     socket.to(to).emit("incomminganswer",{from:socket.id,answer:answer})

   })
   // icecandidate;
   socket.on('icecandidate', (data) => {
    socket.to(data.to).emit('icecandidate', {
        candidate: data.candidate,
    });
    socket.on("recording", (data) => {
      const id = data.myid;
      const src = path.join(__dirname, "video", `recording-${id}.webm`);
  
      // Prepend the correct data URL prefix to decode base64
      const base64Data = data.src.replace(/^data:video\/webm;base64,/, "");; // This is the base64 string
      const buffer = Buffer.from(base64Data, "base64");
      console.log(data.src,"this is data")
      fs.writeFile(src, buffer, (err) => {
          if (err) {
              console.log(err);
          } else {
              console.log("File saved successfully");
          }
      });
  
      console.log(src, "src");
      io.emit("gettingv", { id, src: `/video/recording-${id}.webm` });
  });
  

});
  
   socket.on("disconnect",()=>{
        console.log("user is disconnectedd//")
        userlist.delete(socket.id);
        io.emit("userlist",Array.from(userlist))
    })
})
  
//
app.use("/video",express.static(path.join(__dirname,"video")));

server.listen(PORT, '0.0.0.0', () => {
  console.log("Server is running on port ...");
});
