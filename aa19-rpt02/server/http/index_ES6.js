// http server : index.js

var http = require('http');
port = 3030;

var server = http.createServer((request, response) => {
  response.writeHeader(200, {
    "Content-Type": "text/plain"
  });
  response.write("Hello HTTP server from node.js"); // WEB response
  response.write("\n My ID is AA19!");
  response.end();

});

server.listen(port);
console.log("Server Running on " + port + 
	".\nLaunch http://localhost:" + port);
