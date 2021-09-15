var express = require('express');
var app= express();
var port=3030;

var path=require('path');

app.get('/aa19', function(req,res) {
    res.send('Hello aa19, Comsi! My first express server!!!')
})

app.get('/',function(req,res){
    res.send('<a href="/hello">Hello Page</a>');
});

app.get('/hello',function(req,res){
    res.send('Hello aa18');
});

app.get('/comsi',function(req,res){
    res.send('Hello Comsi!');
});

app.use(express.static(path.join(__dirname, 'public')));

var server = app.listen(port,function(){
    console.log('Listening on port %d',server.address().port);
});