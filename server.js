var express = require('express');
var app = express();
var players = [];
var $ = require("jquery");
var http = require('http');
var server = http.createServer(app);
fs = require("fs");
path = require("path");

server.listen(8000);
app.use(express.static('public'));
app.get('/', function(req,res){
    res.sendfile('index.html');
    });
var io = require("socket.io").listen(server);
console.log("Server running");
 //Gameloop
 var FPS = 30;
 setInterval(function() {
 }, 1000/FPS);

var gameState = {
    Players: [],
    Bullets: []
};

function Player (name, color) {
    this.color = color;
    this.name = name;
    this.x = randomint(100,1200);
    this.y = randomint(50,800);
  gameState.Players.push(this);
  gameState.Players.forEach(function(index, key){
      console.log(index.name, index.color, index.x, index.y);
  })
};
io.sockets.on("connection",function(socket){
    socket.on("join",function(data) {
        new Player(data.name, data.color);
        io.sockets.emit("update", gameState);
    });
});

var randomint = function(min, max)
{
    range = (max - min) + 1;
    return Math.round((Math.random() * range) + min);
}
