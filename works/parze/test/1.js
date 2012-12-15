
var fs = require('fs');
var read = function(file) {
	return fs.readFileSync("test/" + file + ".txt", "utf-8");
}


var Parze = require('../parze.js').Parze;
require('../parze.hatenap.js');

var hatena = Parze.Plugin.load("hatena+");
console.log(hatena.parse(read("hatena1")));






