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
var gamestarted = false;
//list of players that pressed ready
var readyPlayers = [];

//player constructor
function Player (name, color, id) {
    this.active = true;
    this.id = id;
    this.maxhp = 100;
    this.hp = 100;
    this.color = color;
    this.name = name;
    this.x = randomint(100,1200);
    this.y = randomint(50,800);
    this.speed = 4;
    this.radius = 25;
    this.ready = false;
    this.trump = false;
  gameState.Players.push(this);
  CollisionObjs.push(this);
};

//bullet constructor
function Bullet(ex,ey, player,trump){
    this.active = true;
    this.origin = player.id;
    this.x = player.x;
    this.y = player.y;
    this.speed = 10;
    this.byTrump = trump;
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
        if(readyPlayers.length == gameState.Players.length && gamestarted == false &&  readyPlayers.length >= 1) {
            chooseTrump();
            console.log("#MAGA")
            io.sockets.emit("hideLobby");
            gamestarted = true;
        }
        else if(gamestarted) {
            updatePlayer(player, gamedata.keypressed);
            if (gamedata.clickx != null && player != null) {
                if (player.active) {
                    bullet = new Bullet(gamedata.clickx, gamedata.clicky, player, player.trump);
                }
            }
            if (gameState.Bullets != null) {
                updateBullets();
            }
            checkCollision();
            io.sockets.emit("update", gameState);
        }
    });
    socket.on("messagesent",function(message){
        gameState.Players.forEach(function(index,key){
            if(index.id == socket.id){
                io.sockets.emit("syncmessage", index.name + ": " + message + "\n");
            }
        })

    })

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

var chooseTrump = function(){
    var trump = gameState.Players[Math.floor(Math.random() * gameState.Players.length)];
    var index = gameState.Players.indexOf(trump);
    trump.trump = true;
    trump.radius = 50;
    trump.maxhp = 100*(gameState.Players.length);
    trump.hp = trump.maxhp;
    gameState.Players[index] = trump;

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
var checkCollision = function() {
    CollisionObjs.forEach(function (index, key) {
            CollisionObjs.forEach(function (index2, key2) {
                    var dx = index.x - index2.x;
                    var dy = index.y - index2.y;
                    var distance = Math.sqrt(dx * dx + dy * dy);

                    //Bullet - Player collisions
                    if (distance < index.radius + index2.radius) {
                        if (index instanceof Bullet && index2 instanceof Player && index2.active) {
                            if (index.origin != index2.id && (index.byTrump && !index2.trump || !index.byTrump && index2.trump)) {
                                var temp = gameState.Players.indexOf(index2);
                                index2.hp -= bulletDamage;
                                gameState.Players[temp] = index2;
                                CollisionObjs.splice(CollisionObjs.indexOf(index),1);
                                gameState.Bullets.splice(gameState.Bullets.indexOf(index),1);
                            }
                        }
                        if (index instanceof Player && index2 instanceof Bullet && index.active) {
                            if (index2.origin != index.id && (index2.byTrump && !index.trump || !index2.byTrump && index.trump)) {
                                var temp = gameState.Players.indexOf(index);
                                index.hp -= bulletDamage;
                                gameState.Players[temp] = index;
                                CollisionObjs.splice(CollisionObjs.indexOf(index2),1);
                                gameState.Bullets.splice(gameState.Bullets.indexOf(index2),1);
                            }
                        }

                        //Player - Player collisions
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

                    //Object - Wall collisions
                    if (index.x <= index.radius) {
                        index.x += index.speed;
                        if(index instanceof Bullet){
                            CollisionObjs.splice(CollisionObjs.indexOf(index),1);
                            gameState.Bullets.splice(gameState.Bullets.indexOf(index),1);
                        }
                    }
                    if (index.x >= 1200 - index.radius) {
                        index.x -= index.speed;
                        if(index instanceof Bullet){
                            CollisionObjs.splice(CollisionObjs.indexOf(index),1);
                            gameState.Bullets.splice(gameState.Bullets.indexOf(index),1);
                        }
                    }
                    if (index.y-20 <= index.radius) {
                        index.y += index.speed;
                        if(index instanceof Bullet){
                            CollisionObjs.splice(CollisionObjs.indexOf(index),1);
                            gameState.Bullets.splice(gameState.Bullets.indexOf(index),1);
                        }
                    }
                    if (index.y+30 >= 900 - index.radius) {
                        index.y -= index.speed;
                        if(index instanceof Bullet){
                            CollisionObjs.splice(CollisionObjs.indexOf(index),1);
                            gameState.Bullets.splice(gameState.Bullets.indexOf(index),1);
                        }
                    }
            })
    })
}