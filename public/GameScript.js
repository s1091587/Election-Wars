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
    $(document).keydown(function(e) {
        if(e.which == 38 && e.which == 37) {
            alert("hoi");
          keypressed="leftup";
        }
       else if (e.which == 37) {
            keypressed = "left";
        }
        else if (e.which == 39) {
            keypressed = "right";
        }
        else if (e.which == 38) {
            keypressed = "up";
        }
        else if (e.which == 40) {
            keypressed = "down";
        }
    });
//server emits "updateRequest", client returns "updateResponse" with keypressed variable
socket.on("updateRequest", function(){
    socket.emit("updateResponse", keypressed);
});


});