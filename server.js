var express = require('express');
var app = express();
var players = [];
var $ = require("jquery");
var http = require('http');
var server = http.createServer(app);
fs = require("fs");
path = require("path");

server.listen(8000);
app.use(express.static(__dirname+'/public'));
app.get('/', function(req,res){
    res.sendfile(__dirname+'/index.html');
    });
var io = require("socket.io").listen(server);
console.log("Server running");
 //Gameloop
 var FPS = 30;
 setInterval(function() {
     io.sockets.emit("updateRequest");
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
    this.speed = 5;
  gameState.Players.push(this);
};
io.sockets.on("connection",function(socket){
    socket.on("join",function(data) {
        var player = new Player(data.name, data.color);
        io.sockets.emit("update", gameState);
    });
    socket.on("updateResponse", function(keypressed){
        if(keypressed == "left"){
            player.x -= player.speed;
        }
        else if(keypressed == "right"){
            player.x += player.speed;
        }
        else if(keypressed == "up"){
            player.y -= player.speed;
        }
        else if(keypressed == "down"){
            player.y += player.speed;
        }
        var index = gameState.Players.indexOf(player);
        gameState.Players[index] = player;
    });
});

var randomint = function(min, max)
{
    range = (max - min) + 1;
    return Math.round((Math.random() * range) + min);
}
