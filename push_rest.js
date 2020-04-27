//
// Please make sure to read and understand README.md and LICENSE.txt.
//
// This file was prepared in the research project COCOP (Coordinating
// Optimisation of Complex Industrial Processes).
// https://cocop-spire.eu/
// Author: Antti Kätkytniemi, Tampere University, Finland
// Last modified: 4/2020


"use strict";

var fs = require('fs');
var express = require('express');
var connection = express();

const bodyParser = require('body-parser');
connection.use(bodyParser.text({type:'*/*'}));

function removeComments(params){
  var array = [];
  var j = 0;
  for(var i = 0; i < params.length; i++){
    if(params[i].charAt(0) !== '#'){
      if(params[i] !== ''){
        array[j] = params[i];
        ++j;
      }
    }
  }
  return array;
}

function makeObject(params){
  params = removeComments(params);
  var array = params[0].split(":");
  var string = '{"' + array[0] + '":' + array[1];
  for(var i = 1; i < params.length; i++){
    array = params[i].split(":");
    string = string + ', "' + array[0] + '":' + array[1];
  }
  params = string + "}";
  return JSON.parse(params);
}

var connparams = makeObject(fs.readFileSync(process.argv[2], 'utf-8').replace(/\r\n/g,'\n').replace(/\\/g,'\\\\').split('\n'));

const { fork } = require('child_process');

var childs = {};

connection.post('/', function(req, res){
  var child = fork('.\\push.js', [req.body, JSON.stringify(connparams)]);
  var pidChild = child.pid;
  childs[pidChild] = child;
  console.log('New process: ' + pidChild + '.');
  res.json({pid:pidChild});
  child.on('close', (code) => {
    console.log('Process ' + pidChild + ' killed.');
    //console.log(`Child process exited with code ${code}`);
    delete childs[pidChild];
  });
})

connection.delete('/:pid', function(req, res){
  if(childs[req.params.pid] != null){
    childs[req.params.pid].kill('SIGTERM');
    //console.log('Process ' + req.params.pid + ' killed.');
    res.send('Process: ' + req.params.pid + ' stopped.');
    delete childs[req.params.pid];
  }
  else{
    res.status(400).send('Invalid pid or process terminated.');
  }
})

connection.listen(connparams.serverport, () => console.log('Server on port ' + connparams.serverport + '!'));
