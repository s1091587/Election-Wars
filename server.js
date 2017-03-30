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
app.get("*", function(req,res){
    res.sendFile(__dirname+"/404.html");
});
var io = require("socket.io").listen(server);
console.log("Server running");

//Gameloop
var FPS = 120;
 setInterval(function() {
     //send update request to the client
     io.sockets.emit("updateRequest");
}, 1000/FPS);

var bulletDamage = 5;
var CollisionObjs = []
var gameState = {
    Players: [],
    Bullets: []
};

//list of players that pressed ready
var readyPlayers = [];

//player constructor
function Player (name, color, id) {
    this.active = true;
    this.id = id;
    this.hp = 100;
    this.color = color;
    this.name = name;
    this.x = randomint(100,1200);
    this.y = randomint(50,800);
    this.speed = 5;
    this.radius = 25;
    this.ready = false;
  gameState.Players.push(this);
  CollisionObjs.push(this);
};

//bullet constructor
function Bullet(ex,ey, player){
    this.active = true;
    this.origin = player.id;
    this.x = player.x;
    this.y = player.y;
    this.speed = 10;
    this.byTrump = false;
    this.radius = 10;
    calculateVel(this,player,ex,ey);
    gameState.Bullets.push(this);
    CollisionObjs.push(this);
};
io.sockets.on("connection",function(socket){
    var player;
    var bullet;
    console.log(socket.id + " connected");
    
    //get player data from the client after submit button clicked
    socket.on("join",function(data) {
        player = new Player(data.name, data.color, socket.id);
        socket.emit("playerlist", gameState.Players);     
        //send new updated list of players to the client
        io.sockets.emit("playersUpdatedStatus", gameState.Players)
    });

    socket.on("updateResponse", function(gamedata){
        //check if players are ready before sending gamedata and drawing everything.
        if(readyPlayers.length == 3){
            socket.emit("hideLobby");
            updatePlayer(player,gamedata.keypressed);
            if(gamedata.clickx != null && player != null) {
                if (player.active) {
                    bullet = new Bullet(gamedata.clickx, gamedata.clicky, player);
                }
            }
            if(gameState.Bullets != null ) {
                    updateBullets();
            }
            checkCollision();
            io.sockets.emit("update", gameState);
            
        }
    });
    

    //listen if ready button is pressed by player and add player to list of ready players
    socket.on("pressedready", function(ready){
        gameState.Players.forEach(function(index,key){
            if(index.id == socket.id){
                gameState.Players[key].ready = true;
                if(index.ready = true){
                   readyPlayers.push(index); 
                }              
            }
        })
        //send new updated list of players to the client
        console.log(readyPlayers.length);
        io.sockets.emit("playersUpdatedStatus", gameState.Players)
        
    })
    
});

var randomint = function(min, max)
{
    range = (max - min) + 1;
    return Math.round((Math.random() * range) + min);
};
var updatePlayer = function(player,keypressed) {
    if (player) {
        if (player.active) {
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
            if (player.hp <= 0) {
                player.active = false;
            }
            gameState.Players[index] = player;
        }
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
        if(index.active) {
            var current = gameState.Bullets.indexOf(index);
            index.x += index.velX;
            index.y += index.velY;
            gameState.Bullets[current] = index;
        }
    })
}
var checkCollision = function() {
    CollisionObjs.forEach(function (index, key) {
        if(index.active == true) {
            CollisionObjs.forEach(function (index2, key2) {
                if(index2.active == true) {
                    var dx = index.x - index2.x;
                    var dy = index.y - index2.y;
                    var distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < index.radius + index2.radius) {
                        if (index instanceof Bullet && index2 instanceof Player && index.active) {
                            if (index.origin != index2.id) {
                                var temp = gameState.Players.indexOf(index2);
                                index2.hp -= bulletDamage;
                                gameState.Players[temp] = index2;
                                var bulleti = gameState.Bullets.indexOf(index);
                                index.active = false;
                                gameState.Bullets[bulleti] = bulleti;
                            }
                        }
                        if (index instanceof Player && index2 instanceof Bullet && index2.active) {
                            if (index2.origin != index.id) {
                                var temp = gameState.Players.indexOf(index);
                                index.hp -= bulletDamage;
                                gameState.Players[temp] = index;
                                var bulleti = gameState.Bullets.indexOf(index2);
                                index2.active = false;
                                gameState.Bullets[bulleti] = bulleti;
                            }
                        }
                        if (index instanceof Player && index2 instanceof Player) {
                            if (index != index2) {
                                var temp = gameState.Players.indexOf(index);
                                var temp2 = gameState.Players.indexOf(index2);
                                if (index.x < index2.x && index.y < index2.y) {
                                    index.x -= index.speed;
                                    index.y -= index.speed;
                                    index2.x += index.speed;
                                    index2.y += index.speed;
                                }
                                else if (index.x < index2.x && index.y > index2.y) {
                                    index.x -= index.speed;
                                    index.y += index.speed;
                                    index2.x += index.speed;
                                    index2.y -= index.speed;
                                }
                                else if (index.x > index2.x && index.y < index2.y) {
                                    index.x += index.speed;
                                    index.y -= index.speed;
                                    index2.x -= index.speed;
                                    index2.y += index.speed;
                                }
                                else if (index.x > index2.x && index.y > index2.y) {
                                    index.x += index.speed;
                                    index.y += index.speed;
                                    index2.x -= index.speed;
                                    index2.y -= index.speed;
                                }

                                index.y -= index.speed;
                                gameState.Players[temp] = index;
                                gameState.Players[temp2] = index2;
                            }
                        }
                    }
                    if (index.x <= index.radius) {
                        index.x += index.speed;
                        if (index instanceof Bullet) {
                            var bulleti = gameState.Bullets.indexOf(index2);
                            index.active = false;
                            gameState.Bullets[bulleti] = bulleti;
                        }
                    }
                    if (index.x >= 1200 - index.radius) {
                        index.x -= index.speed;
                        if (index instanceof Bullet) {
                            var bulleti = gameState.Bullets.indexOf(index2);
                            index.active = false;
                            gameState.Bullets[bulleti] = bulleti;
                        }
                    }
                    if (index.y <= index.radius) {
                        index.y += index.speed;
                        if (index instanceof Bullet) {
                            var bulleti = gameState.Bullets.indexOf(index2);
                            index.active = false;
                            gameState.Bullets[bulleti] = bulleti;
                        }
                    }
                    if (index.y >= 800 - index.radius) {
                        index.y -= index.speed;
                        if (index instanceof Bullet) {
                            var bulleti = gameState.Bullets.indexOf(index2);
                            index.active = false;
                            gameState.Bullets[bulleti] = bulleti;
                        }
                    }
                }
            })
        }
    })
}