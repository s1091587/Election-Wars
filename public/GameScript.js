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
        color : "roze"
    };
    alert("winegums zijn de shit");
    socket.emit("join", data);
});

socket.on("update", function(gamestate){
    alert("macbooks zijn stom >:(");
    draw(gamestate);
})

//draw function
var draw = function(gamestate){
    gamestate.Players.forEach(function(index, key){
        alert("test - " + index.name);
        canvas.beginPath();
        canvas.arc(index.x, index.y, 25, 0, Math.PI*2);
        canvas.fillStyle = color;
        canvas.fill();
    });
    
    
};


});