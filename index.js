const express = require("express");
const app = express();
const http = require("https")
const path = require("path");
const socketio = require("socket.io")


const server = http.createServer(app);
const io = socketio(server);


app.use(express.static(path.join(__dirname,"public")))
app.get("/",(req,resp)=>{
    resp.sendFile(path.join(__dirname,"public","about.html"))
})
app.get("/about",(req,resp)=>{
  resp.sendFile(path.join(__dirname,"public","index.html"))
})
const userlist =  new Set();
io.on("connection",(socket)=>{
    console.log("a user is connected",socket.id);
    
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
    console.log("enter into callaccepted;",data)
     const {answer,to} = data;
     socket.to(to).emit("incomminganswer",{from:socket.id,answer:answer})

   })
   // icecandidate;
   socket.on('icecandidate', (data) => {
    socket.to(data.to).emit('icecandidate', {
        candidate: data.candidate,
    });

});
  
   socket.on("disconnect",()=>{
        console.log("user is disconnectedd//")
        userlist.delete(socket.id);
        io.emit("userlist",Array.from(userlist))
    })
})
  
//


server.listen(4000,()=>{
    console.log("server is running..")
})