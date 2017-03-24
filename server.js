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
 var FPS = 120;
 setInterval(function() {
     io.sockets.emit("updateRequest");
 }, 1000/FPS);

var gameState = {
    Players: [],
    Bullets: []
};

function Player (name, color, id) {
    this.id = id;
    this.color = color;
    this.name = name;
    this.x = randomint(100,1200);
    this.y = randomint(50,800);
    this.speed = 5;
  gameState.Players.push(this);
};
function Bullet(x, y, ex,ey, player){
    this.x = x;
    this.y = y;
    this.speed = 10;
    this.byTrump = false;
    calculateVel(this,player,ex,ey);
    gameState.Bullets.push(this);

};
io.sockets.on("connection",function(socket){
    var player;
    var bullet;
    console.log(socket.id + " connected");
    socket.on("join",function(data) {
        player = new Player(data.name, data.color, socket.id);
    });
    socket.on("updateResponse", function(gamedata){
            updatePlayer(player,gamedata.keypressed);
            if(gamedata.clickx != null){
                bullet = new Bullet(player.x, player.y,gamedata.clickx, gamedata.clicky, player);
            }
            if(gameState.Bullets != null) {
                updateBullets();
            }
            io.sockets.emit("update", gameState);
});
});

var randomint = function(min, max)
{
    range = (max - min) + 1;
    return Math.round((Math.random() * range) + min);
};
var updatePlayer = function(player,keypressed) {
    if (player) {
        if (keypressed == "left") {
            player.x -= player.speed;
        }
        else if (keypressed == "right") {
            player.x += player.speed;
        }
        else if (keypressed == "up") {
            player.y -= player.speed;
        }
        else if (keypressed == "down") {
            player.y += player.speed;
        }
        else if (keypressed == "leftup") {
            player.y -= player.speed;
            player.x -= player.speed;
        }
        else if (keypressed == "rightup") {
            player.y -= player.speed;
            player.x += player.speed;
        }
        else if (keypressed == "leftdown") {
            player.y += player.speed;
            player.x -= player.speed;
        }
        else if (keypressed == "rightdown") {
            player.y += player.speed;
            player.x += player.speed;
        }
        else if (keypressed == "none") {
            player.x = player.x;
            player.y = player.y;
        }
        var index = gameState.Players.indexOf(player);
        gameState.Players[index] = player;
    }
}

var calculateVel = function(bullet, player, ex,ey){
    var dx = (ex -player.x);
    var dy = (ey - player.y);
    var mag = Math.sqrt(dx * dx + dy * dy);
    bullet.velX = (dx / mag) * bullet.speed;
    bullet.velY = (dy / mag) * bullet.speed;
}
var updateBullets = function() {
    gameState.Bullets.forEach(function (index, key) {
        var current = gameState.Bullets.indexOf(index);
        index.x += index.velX;
        index.y += index.velY;
        gameState.Bullets[current] = index;

    })
}