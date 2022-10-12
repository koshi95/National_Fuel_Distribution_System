const express = require("express"); 
const app     = express();
const http    = require("http").createServer(app);
const path    = require("path")

app.use(express.urlencoded({extended: true}));
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')))

app.use("/", require("./routes/mainRoutes"))
app.use("/api/", require("./routes/apiRoutes"))
app.use("/api/admin/", require("./routes/adminAPIRoutes"))
app.use("/admin/", require("./routes/adminRoutes"))
app.use("/api/pumper/", require("./routes/pumperAPIRoutes"))

require("dotenv").config()


var socketIO = require("socket.io")(http, {
    cors: {
        origin: "*"
    }
});
var users = [];
socketIO.on("connection", function (socket) {
    socket.on("connected", function (id) {
        users[id] = socket.id;
        console.log("User connected successfully")
    });
});
app.post('/api/scan/ygde87643ijd4hf74', (req, res) => {
    if ( !req.body.vehicleNo ) {
        res.send({"msg":false, val: "Empty vehicle number"})
        return;
    }
    socketIO.to(users['1']).emit("scan", req.body.vehicleNo);
    res.send({"msg":true, val: "success"})
})


var port = process.env.PORT || 3000;
http.listen(port, ()=> {
    console.log('listening on port ' + port);
});