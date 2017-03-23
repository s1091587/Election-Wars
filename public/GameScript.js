$(document).ready(function() {
var socket = io.connect("localhost:8000");

var CANVAS_WIDTH = 1200;
var CANVAS_HEIGHT = 800;

var canvasElement = $("<canvas width='" + CANVAS_WIDTH + 
                      "' height='" + CANVAS_HEIGHT + "'></canvas>");
var canvas = canvasElement.get(0).getContext("2d");
canvasElement.appendTo('body');

//form join function
$("#submit").click(function() {
    var data = {
        name : $("#name").val(),
        color : $("#color").val()
    };
    socket.emit("join", data);
});

socket.on("update", function(gamestate){
    draw(gamestate);
});


//draw function
var draw = function(gamestate){
    canvas.clearRect(0,0,CANVAS_WIDTH, CANVAS_HEIGHT);
    gamestate.Players.forEach(function(index, key){
        canvas.beginPath();
        canvas.arc(index.x, index.y, 25, 0, Math.PI*2);
        canvas.fillStyle = index.color;
        canvas.font = "20px comic sans ms";
        canvas.fillText(index.name, index.x-10, index.y-35);
        canvas.fill();
    });   
};

//check for keyevents and store in "keypressed" variable
var keypressed;
var keymap = {37: false, 38: false, 39: false, 40: false}
    $(document).keydown(function(e) {
        if(e.keyCode in keymap){
            keymap[e.keyCode] = true;
        }
        if(keymap[37] == true &&keymap[38] == true){
            keypressed = "leftup";
        }
        else if(keymap[38] == true &&keymap[39] == true){
            keypressed = "rightup";
        }
        else if(keymap[39] == true &&keymap[40] == true){
            keypressed = "rightdown";
        }
        else if(keymap[37] == true &&keymap[40] == true){
            keypressed = "leftdown";
        }
        else if(keymap[37]){
            keypressed = "left";
        }
        else if(keymap[38] == true){
            keypressed = "up";
        }
        else if(keymap[39] == true){
            keypressed = "right";
        }
        else if(keymap[40] == true){
            keypressed = "down";
        }
        else{
            keypressed = "none";
        }
        console.log(keypressed);
    }).keyup(function (e) {
        if(e.keyCode in keymap){
            keymap[e.keyCode] = false;
        }
        if(keymap[37] == false && keymap[38] == false && keymap[39] == false && keymap[40] == false){
            keypressed = "none";
        }
    })
//server emits "updateRequest", client returns "updateResponse" with keypressed variable
socket.on("updateRequest", function(){
    socket.emit("updateResponse", keypressed);
});


});