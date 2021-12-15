// db33rgb.js

var serialport = require('serialport');
var portName = 'COM3';  // check your COM port!!
var port    =   process.env.PORT || 3000;  // port for DB

var io = require('socket.io').listen(port);

// MongoDB
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// MongoDB connection
mongoose.connect("mongodb://localhost:27017/project", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
    console.log("mongo db connection OK.");
});
// Schema
var axisSchema = new Schema({
    date : String,
    accel_x : String,
    accel_y : String,
    accel_z : String,
    gyro_x : String,
    gyro_y : String,
    gyro_z : String,
    mag_x : String,
    mag_y : String,
    mag_z : String
}, {
    versionKey : false
});
// Display data on console in the case of saving data.
axisSchema.methods.info = function () {
    var axisInfo = this.date ?
    "Current date: " + this.date 
    + ", accel_x : " + this.accel_x  + ", accel_y : " + this.accel_y + ", accel_z : " + this.accel_z 
    + ", gyro_x : " + this.gyro_x + ", gyro_y : " + this.gyro_y + ", gyro_z : " + this.gyro_z 
    + ", mag_x: " + this.mag_x + ", mag_y : " + this.mag_y + ", mag_z: " + this.mag_z : "I don't have a date";

    console.log("axisInfo: " + axisInfo);
}


const Readline = require("@serialport/parser-readline");

// serial port object
var sp = new serialport(portName, {
  baudRate: 9600, // 9600  38400
  dataBits: 8,
  parity: "none",
  stopBits: 1,
  flowControl: false,
  parser: new Readline("\r\n"),
  //   parser: serialport.parsers.readline("\r\n"), // new serialport.parsers.Readline
});

// set parser
const parser = sp.pipe(new Readline({ delimiter: "\r\n" }));

// Open the port 
// sp.on("open", () => {
//     console.log("serial port open");
//   });

var readData = '';  // this stores the buffer
var accel_x  = '';
var accel_y  = '';
var accel_z  = '';
var gyro_x  = '';
var gyro_y  = '';
var gyro_z  = '';
var mag_x  = '';
var mag_y  = '';
var mag_z  = '';

var mdata =[]; // this array stores date and data from multiple sensors
var firsthx = 0;
var secondthx = 0;
var thirdthx = 0;
var fourthx = 0;
var fifthx = 0;
var sixthx = 0;
var seventhx = 0;
var eighthx = 0;
var ninethx = 0;

var Sensor = mongoose.model("Sensor", axisSchema);  // sensor data model

// process data using parser
parser.on('data', (data) => { // call back when data is received
    readData = data.toString(); // append data to buffer
    firsthx = readData.indexOf(','); 
    secondthx = readData.indexOf(',',firsthx+1);
    thirdthx = readData.indexOf(',',secondthx+1);
    fourthx = readData.indexOf(',',thirdthx+1);
    fifthx = readData.indexOf(',',fourthx+1);
    sixthx = readData.indexOf(',',fifthx+1);
    seventhx = readData.indexOf(',',sixthx+1);
    eighthx = readData.indexOf(',',seventhx+1);
    ninethx = readData.indexOf(',',eighthx+1);
    tenthx = readData.indexOf(',', ninethx+1);

    // parsing data into signals
    if (readData.lastIndexOf(',') > firsthx && firsthx > 0) {
        accel_x = readData.substring(firsthx+1, secondthx);
        accel_y = readData.substring(secondthx+1, thirdthx);
        accel_z = readData.substring(thirdthx+1, fourthx);
        gyro_x = readData.substring(fourthx+1, fifthx);
        gyro_y = readData.substring(fifthx+1,sixthx);
        gyro_z = readData.substring(sixthx+1,seventhx);
        mag_x = readData.substring(seventhx+1,eighthx);
        mag_y = readData.substring(eighthx+1,ninethx);
        mag_z = readData.substring(readData.lastIndexOf(',')+1);
        readData = '';
        
        dStr = getDateString();

        mdata[0]=dStr;   
        mdata[1]=accel_x;   
        mdata[2]=accel_y;  
        mdata[3]=accel_z;    
        mdata[4]=gyro_x;   
        mdata[5]=gyro_y;  
        mdata[6]=gyro_z;      
        mdata[7]=mag_x;       
        mdata[8]=mag_y;
        mdata[9]=mag_z;
        
        //console.log(mdata);
        var axisData = new Sensor({date:dStr, accel_x:accel_x, accel_y:accel_y, accel_z:accel_z
                                            , gyro_x:gyro_x, gyro_y:gyro_y, gyro_z:gyro_z
                                            , mag_x:mag_x, mag_y:mag_y, mag_z:mag_z})

        // save axis data to MongoDB
        axisData.save(function(err,data) {
            if(err) return handleEvent(err);
            data.info();  // Display the information of axis data  on console.
        })
        io.sockets.emit('message', mdata);  // send data to all clients 
    } else {  // error 
        console.log(readData);
    }
});


io.sockets.on('connection', function (socket) {
    // If socket.io receives message from the client browser then 
    // this call back will be executed.
    socket.on('message', function (msg) {
        console.log(msg);
    });
    // If a web browser disconnects from Socket.IO then this callback is called.
    socket.on('disconnect', function () {
        console.log('disconnected');
    });
});

// helper function to get a nicely formatted date string
function getDateString() {
    var time = new Date().getTime();
    // 32400000 is (GMT+9 Korea, GimHae)
    // for your timezone just multiply +/-GMT by 3600000
    var datestr = new Date(time +32400000).
    toISOString().replace(/T/, ' ').replace(/Z/, '');
    return datestr;
}