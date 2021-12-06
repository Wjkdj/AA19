// db33rgb.js

var serialport = require('serialport');
var portName = 'COM8';  // check your COM port!!
var port    =   process.env.PORT || 3000;  // port for DB

var io = require('socket.io').listen(port);

// MongoDB
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// MongoDB connection
mongoose.connect("mongodb://localhost:27017/iot33imu", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
    console.log("mongo db connection OK.");
});
// Schema
var iotSchema = new Schema({
    date : String,
    acc_x : String,
    acc_y : String,
    acc_z : String,
    gyro_x : String,
    gyro_y : String,
    gyro_z : String,
    mag_x : String,
    mag_y : String,
    mag_z : String
});
// Display data on console in the case of saving data.
iotSchema.methods.info = function () {
    var iotInfo = this.date
    ? "Current date: " + this.date +", Acc_x: " + this.acc_x 
    + ", Acc_y: " + this.acc_y + ", Acc_z: " + this.acc_z + ", gyro_x: " + this.gyro_x  
    + ", gyro_y: " + this.gyro_y + ", gyro_z: " + this.gyro_z + ", mag_x: " + this.mag_x
    + ", mag_y" + this.mag_y + ", mag_z" + this.mag_z : "I don't have data"
    console.log("iotInfo: " + iotInfo);
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
var acc_x = '';
var acc_y = '';
var acc_z = '';
var gyro_x = '';
var gyro_y = '';
var gyro_z = '';
var mag_x = '';
var mag_y = '';
var mag_z = '';

var mdata =[]; // this array stores date and data from multiple sensors
var firstcommaidx = 0;
var secondcommaidx = 0;
var thirdcommaidx = 0;
var fourthcommaidx = 0;
var fifthcommaidx = 0;
var sixthcommaidx = 0;

var Sensor = mongoose.model("Sensor", iotSchema);  // sensor data model

// process data using parser
parser.on('data', (data) => { // call back when data is received
    readData = data.toString(); // append data to buffer
    firstcommaidx = readData.indexOf(','); 
    secondcommaidx = readData.indexOf(',',firstcommaidx+1);
    thirdcommaidx = readData.indexOf(',',secondcommaidx+1);
    fourthcommaidx = readData.indexOf(',',thirdcommaidx+1);
    fifthcommaidx = readData.indexOf(',',fourthcommaidx+1);
    sixthcommaidx = readData.indexOf(',',fifthcommaidx+1);

    // parsing data into signals
    if (readData.lastIndexOf(',') > firstcommaidx && firstcommaidx > 0) {
        temp = readData.substring(firstcommaidx + 1, secondcommaidx);
        humi = readData.substring(secondcommaidx + 1, thirdcommaidx);
        lux = readData.substring(thirdcommaidx + 1, fourthcommaidx);
        pres = readData.substring(fourthcommaidx + 1, fifthcommaidx);
        rr = readData.substring(fifthcommaidx + 1, sixthcommaidx);
        gg = readData.substring(sixthcommaidx + 1, readData.indexOf(',',sixthcommaidx+1));
        bb = readData.substring(readData.lastIndexOf(',')+1);
        
        readData = '';
        
        dStr = getDateString();
        mdata[0]=dStr;    // Date
        mdata[1]=acc_x;    // temperature data
        mdata[2]=acc_y;    // humidity data
        mdata[3]=acc_z;     //  luminosity data
        mdata[4]=gyro_x;    // pressure data
        mdata[5]=gyro_y;       // r_ratio
        mdata[6]=gyro_z;       // g_ratio
        mdata[7]=mag_x;       // b_ratio
        mdata[8]=mag_y;
        mdata[9]=mag_z;
        //console.log(mdata);
        var iotData = new Sensor({date:dStr, temperature:temp, humidity:humi, luminosity:lux, pressure:pres, 
            r_ratio:rr, g_ratio:gg, b_ratio:bb});
        // save iot data to MongoDB
        iotData.save(function(err,data) {
            if(err) return handleEvent(err);
            data.info();  // Display the information of iot data  on console.
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