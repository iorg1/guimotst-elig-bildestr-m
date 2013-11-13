var app = require('http').createServer()
  , io = require('socket.io').listen(app, { log: false })
  , fs = require('fs')
  , chokidar = require('chokidar');

app.listen(1237);

var emit = function(event, data){
  clients.forEach(function (client) {
    client.emit(event, data);
  });
};

var resetTimer = function () {
  clearTimeout(timeout);
  timeout = setTimeout(loadFromArchive, (3 + Math.random()*5)*1000);
};

var loadFromArchive = function(){
  var files = fs.readdirSync(__dirname + '/imagepool');
  if(files.length > 0){
      var index = Math.floor((Math.random()*files.length));
      fs.readFile(__dirname + '/imagepool/' + files[index], 'base64', function(err, data){
        if(!err){
          emit('picture', 'data:image/jpg;base64,' + data);
        }else{
          emit('error', err);
        }
      });
  };
  resetTimer();
};

var uploadDir = chokidar.watch(__dirname + '/images', {ignored: /^\./, persistent: true});

var clients = [];
var timeout = 0;
io.sockets.on('connection', function (socket) {
  console.log('client connected');
  clients.push(socket);
  uploadDir
    .on('add', function(path) {
      fs.readFile(path, 'base64', function(err, data){
      if(!err){
        emit('picture', 'data:image/jpg;base64,' + data);
        resetTimer();
      }else{
        emit('error', err);
      }
    });
  });
  socket.on('addphoto', function (data) {
    console.log('photo gotten');
    if(data && data.dataurl){
      var base64Data = data.dataurl.replace(/^data:image\/jpeg;base64,/, ""); 
      base64Data += base64Data.replace('+', ' ');
      binaryData = new Buffer(base64Data, 'base64').toString('binary');

      fs.writeFile(__dirname + '/imagepool/' + Math.floor(Math.random() * 10000000) + ".jpg", binaryData, "binary", function (err) {});
      emit('picture', data.dataurl);
      resetTimer();
    }else{
      console.log('Worng input', data);
    }
    
  });
  
  resetTimer();
});