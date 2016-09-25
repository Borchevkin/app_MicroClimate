function SensorPuck(addr) {
    this.parseData = function(dataPacket) {
        if (dataPacket.length === 14) {
            //parsing enviromental data
            this.humidity = ((dataPacket[7] << 8) | dataPacket[6])/10;
            this.temperature = ((dataPacket[9] << 8) | dataPacket[8])/10;
            this.lux = ((dataPacket[11] << 8) | dataPacket[10]) * 2;
            this.uv = dataPacket[12]; 
            this.batteryLevel = dataPacket[13] / 10;
            return;
        }
        if (dataPacket.length === 18) {
            //parsing biometric data
            debugMessage("Activating Biometric mode for Sensor Puck. No parsing");
        }
    };
    
    this.address = addr;
    this.temperature = null;
    this.humidity = null;
    this.lux = null;
    this.uv = null;
    this.batteryLevel = null;
}

function Thunderboard(addr) {
    
    this.address = addr;
    this.temperature = null;
    this.humidity = null;
    this.lux = null;
    this.uv = null;
    this.batteryLevel = null;
}

function dweetData(sensor) {
    var request = require("request");
    var url = "http://dweet.io/dweet/for/microclimate_cabinet1";
    var requestData = sensor;
    
    var options = {
        uri: url,
        method: "POST",
        json: requestData
    };
    
    request(options, function(error, response, body) {
        //debugMessage(JSON.stringify(response)); // Print the shortened url.
    });
}

//function sendDataToArtik(sensor, ssid, )

/*
Dog-nail for Edison bluetooth
*/
function bleDogNail() {
    var sys = require('sys')
    var exec = require('child_process').exec;
    function puts(error, stdout, stderr) { sys.puts(stdout) }
    exec("/etc/init.d/bluetooth.sh", puts);
}

function appAlive() {
    debugMessage("App is alive");
}

function debugMessage(msg) {
    if (io !== null) {
        io.emit("log message", {"level": "DEBUG", "value": msg});    
    }
    console.log("[DEBUG] " + msg);
}

setTimeout(bleDogNail, 10000);
setInterval(appAlive, 4000);

var CABINET1_MAC = "d4:81:ca:e1:4a:60";     //Sensor Puck
var CABINET2_MAC = "00:0b:57:0c:37:4d";     //Working first Thunderboard
var CABINET3_MAC = "";

var cabinet1 = new SensorPuck(CABINET1_MAC);
var cabinet2 = new Thunderboard(CABINET2_MAC);
var cabinet3 = new Thunderboard(CABINET3_MAC);

var mraa = require('mraa'); //require mraa
console.log('MRAA Version: ' + mraa.getVersion()); //write the mraa version to the Intel XDK console

/*
var mqttt = require('mqtt');
var ID = "cd68889972694cf4b1084e41c96ac1d1"; // TODO fix
var PROTOCOL = "mqtts";
var BROKER = "api.artik.cloud";
var PORT = 8883;
var URL = PROTOCOL + "://" + BROKER;
URL += ":" + PORT;
var AUTHMETHOD = ID;
var AUTHTOKEN = '40261ec348824283944edbb9a9b0da9a'; // TODO fix
var requireds = { username: AUTHMETHOD, password: AUTHTOKEN };
var mqttConfig = {'url': URL, 'requireds': requreds};
var client = mqtt.connect(mqttConfig.url, mqttConfig.requireds);
var TOPIC = '/v1.1/messages/'+ID;

var client.on("connect", function() {
    setInterval(function () {
        client.publish(TOPIC, JSON.stringify(cabinet1));
    }, 1000*10);
});
*/

var express = require('express');
var app = express();
var path = require('path');
var http = require('http').Server(app);
var io = require('socket.io')(http);

var noble = require("noble");
debugMessage("[BLE] Noble state is " + noble.state);

noble.on('stateChange', function(state) {
    debugMessage("[BLE] Noble State changed to " + state.toString());
    
    if (state === "poweredOn") {
        debugMessage("[BLE] Noble state is poweredOn");
        noble.startScanning([], true);
        debugMessage("[BLE] Start scanning with noble");
    }
});

noble.on('scanStart', function() {
    debugMessage("[BLE] Scan is started");
});

noble.on("scanStop", function() {
    debugMessage("[BLE] Scan was stopped");
});

noble.on('discover', function(peripheral) {
    
    //Parsing data for Sensor Puck, because it work as Beacon and data containts in advertising packet
    if (peripheral.address === cabinet1.address) {
        var data = peripheral.advertisement.manufacturerData;
        cabinet1.parseData(data);
        debugMessage(JSON.stringify(cabinet1));
        dweetData(cabinet1);
        return;
    }
    
    if (peripheral.address === cabinet2.address) {
        var data = peripheral.advertisement.manufacturerData;
        debugMessage(JSON.stringify(data));
        return;
    }
    
    if (peripheral.address === cabinet3.address) {
        return;
    }
        
    //debugMessage('[BLE] Device discovered >> ' + peripheral);
});

noble.on("warning", function(msg) {
    debugMessage("[WARNING] " + msg);
});

app.get('/', function(req, res) {
    //Join all arguments together and normalize the resulting path.
    res.sendFile(path.join(__dirname + '/client', 'index.html'));
});

//Allow use of files in client folder
app.use(express.static(__dirname + '/client'));
app.use('/client', express.static(__dirname + '/client'));

//Socket.io Event handlers
io.on('connection', function(socket) {
    console.log("Connection from web interface established");
    
    socket.on('user disconnect', function(msg) {
    });
    
    socket.on('log message', function(msg) {
        io.emit('log message', msg);
        console.log('message: ' + msg.value);
    });
    
    socket.on('toogle led', function(msg) {
        debugMessage("Hello blyeatm!");
    });
});

http.listen(3000, function(){
    console.log('Web server Active listening on *:3000');
});

