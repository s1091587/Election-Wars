$(document).ready(function() {
var socket = io.connect("localhost:8000");

//get playerlist on every join
socket.on("playerlist", function(playerlist){
    //print joined player names in list and check if they are ready or not (print names green/red)
    playerlist.forEach(function(index, key){
        if (index.ready == false){           
            $("#lobby ul").append('<li id="linotready">'+index.name+'</li>');          
        }
        else if (index.ready == true){         
            $("#lobby ul").append('<li id="liready">'+index.name+'</li>');
        }
    });     
});
//print ready button
$("#lobby").append('<button id="readybtn">Ready</button>');

//hide lobby when receiving the emit from server after all players pressed ready
socket.on("hideLobby", function(){
     $("#lobby").css("display", "none");
})

//variable for player data
var data;

//emit to server if button "readybtn" is pressed, send "true status" and remove the ready button.
$('#lobby').on('click', '#readybtn', function(){
    console.log("ready button is pressed")
    socket.emit("pressedready", true) 
    //remove ready button
    $('button').remove('#readybtn'); 
});

//get new list of players with their updated status (happens after "readybtn" is clicked)
socket.on("playersUpdatedStatus", function(players){
    //clear the UL before filling it again.
    var ul = document.getElementById('ul1');
        if (ul) {
            while (ul.firstChild) {
                    ul.removeChild(ul.firstChild);
            }
        }     
    //print joined players names to list    
    players.forEach(function(index, key){
        if (index.ready == false){         
            $("#lobby ul").append('<li id="linotready">'+index.name+'</li>');    
        }
        else if (index.ready == true){            
            $("#lobby ul").append('<li id="liready">'+index.name+'</li>');
            
        }
    });      
})

var CANVAS_WIDTH = 1200;
var CANVAS_HEIGHT = 800;

var canvasElement = $("<canvas width='" + CANVAS_WIDTH + 
                      "' height='" + CANVAS_HEIGHT + "'></canvas>");
var canvas = canvasElement.get(0).getContext("2d");
var trumpImg = document.getElementById("trump");
canvasElement.appendTo('body');

//handle join/submit button press
$("#submit").click(function() {
    $("body").bind("click",function(e){
        clicked = e;
    });
    
    //put color and name fields into variables
    data = {
        name : $("#name").val(),
        color : $("#color").val()
    };
    
    //hide the join form
    $("#join-form").css("display", "none");
    //show the lobby screen with the player names
    $("#lobby").css("display", "inline");
    //send player data to server
    socket.emit("join", data);  
});

socket.on("update", function(gamestate){
    draw(gamestate);
});


//draw function
var draw = function(gamestate){
    canvas.clearRect(0,0,CANVAS_WIDTH, CANVAS_HEIGHT);
    gamestate.Players.forEach(function(index, key){
        if(index.active) {
            if(index.trump){
            canvas.drawImage(trumpImg, index.x-index.radius,index.y-index.radius);
                canvas.fillStyle = "#000000";
                canvas.fillRect(index.x - 40, index.y + 50, 75, 15);
                if (index.hp >= 1) {
                    canvas.fillStyle = "#ff0000";
                    canvas.fillRect(index.x - 38, index.y + 52, 0.71 * index.hp, 11);
                }
                canvas.fillStyle = "#000000";
                canvas.font = "18px comic sans ms";
                canvas.fillText(index.name, index.x - 30, index.y - 35);
            }
            else{
                canvas.fillStyle = "#000000";
                canvas.fillRect(index.x - 40, index.y + 30, 75, 15);
                canvas.arc(index.x, index.y, index.radius, 0, Math.PI * 2);
                canvas.fillStyle = index.color;
                canvas.fill();
                if (index.hp >= 1) {
                    canvas.fillStyle = "#00ff00";
                    canvas.fillRect(index.x - 38, index.y + 32, 0.71 * index.hp, 11);
                }
                canvas.fillStyle = "#000000";
                canvas.font = "18px comic sans ms";
                canvas.fillText(index.name, index.x - 30, index.y - 35);
            }
        }
    });
    gamestate.Bullets.forEach(function(index,key){
            if(index != null) {
                console.log(gamestate.Bullets.length);
                canvas.beginPath();
                canvas.arc(index.x, index.y, index.radius, 0, Math.PI * 2);
                canvas.fillStyle = "#000000";
                canvas.fill();
            }
    })
    gamestate = null;

};

var clicked;

//check for keyevents and store in "keypressed" variable
var keypressed;
var keymap = {65: false, 87: false, 68: false, 83: false}
    $(document).keydown(function(e) {
        if(e.keyCode in keymap){
            keymap[e.keyCode] = true;
        }
        if(keymap[65] == true &&keymap[87] == true){
            keypressed = "leftup";
        }
        else if(keymap[87] == true &&keymap[68] == true){
            keypressed = "rightup";
        }
        else if(keymap[68] == true &&keymap[83] == true){
            keypressed = "rightdown";
        }
        else if(keymap[65] == true &&keymap[83] == true){
            keypressed = "leftdown";
        }
        else if(keymap[65]){
            keypressed = "left";
        }
        else if(keymap[87] == true){
            keypressed = "up";
        }
        else if(keymap[68] == true){
            keypressed = "right";
        }
        else if(keymap[83] == true){
            keypressed = "down";
        }
        else{
            keypressed = "none";
        }
    }).keyup(function (e) {
        if(e.keyCode in keymap){
            keymap[e.keyCode] = false;
        }
        if(keymap[65] == false && keymap[87] == false && keymap[68] == false && keymap[83] == false){
            keypressed = "none";
        }
    })
    var gamedata;
//server emits "updateRequest", client returns "updateResponse" with new gamedata
socket.on("updateRequest", function(){
    if(clicked != null){
        gamedata = {
            keypressed: keypressed,
            clickx: clicked.pageX,
            clicky: clicked.pageY
        };
    }
    else {
        gamedata = {
            keypressed: keypressed
        };
    }

    socket.emit("updateResponse", gamedata);
    gamedata.clickx = null;
    gamedata.clicky = null;
    clicked = null;
});



});