var socket = io();
var userId = "system";

/*
$('form').submit(function() {
    socket.emit('chat message', {value: $('#m').val(), userId: userId});
    $('#m').val('');
    return false;
});
*/

$("#led-link").on('click', function(e){
    socket.emit('toogle led', {value: 0, userId: userId});
});

socket.on('toogle led', function(msg) {
    if(msg.value === false) {
        $('#messages').prepend($('<li>Toogle LED: OFF<span> - '+msg.userId+'</span></li>'));
        $("#led-container").removeClass("on");
        $("#led-container").addClass("off");
        $("#led-container span").text("OFF");
    }
    else if(msg.value === true) {
        $('#messages').prepend($('<li>Toogle LED: ON<span> - '+msg.userId+'</span></li>'));
        $("#led-container").removeClass("off");
        $("#led-container").addClass("on");
        $("#led-container span").text("ON");
    }
});

socket.on('log message', function(msg) {
    $('#messages').prepend($('<li>[' + msg.level + '] <span>' + msg.value + '</span></li>'));
});

socket.on('connected users', function(msg) {
    
});

socket.on('user connect', function(msg) {
    
});

socket.on('user disconnect', function(msg) {
    
});

window.onunload = function(e) {
    
}