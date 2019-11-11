var createError = require('http-errors');
var path = require('path');
var express = require('express')
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
require('./routes/socketIo')(io);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', require('./routes/index'));


http.listen(process.env.PORT || 4000, () =>{
  console.log("My app listen port 4000")
})