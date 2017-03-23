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
    gamestate.Players.forEach(function(index, key){
        canvas.beginPath();
        canvas.arc(index.x, index.y, 25, 0, Math.PI*2);
        canvas.fillStyle = index.color;
        canvas.fill();
    });   
};

//check for keyevents and store in "keypressed" variable
var keypressed;
var FPS = 40;
setInterval(function() {  
  if (keydown.left) {
    keypressed = "left";
  }
  if (keydown.right) {
    keypressed = "right";
  }
  if (keydown.up) {
    keypressed = "up";
  }
  if (keydown.down) {
    keypressed = "down";
  }
  else{
      keypressed = "none";
  }
}, 1000/FPS);

//server emits "updateRequest", client returns "updateResponse" with keypressed variable
socket.on("updateRequest", function(){
    socket.emit("updateResponse", keypressed);
});


});