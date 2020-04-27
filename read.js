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
var mysql = require('mysql');

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

//dirname has to have last (back)slash
var params = makeObject(fs.readFileSync(process.argv[2], 'utf-8').replace(/\r\n/g,'\n').replace(/\\/g,'\\\\').split('\n'));
var dirname = params.dirname;
var fileExtension = params.extension || false;
var separator = params.separator || ';';

function readFiles(dirname){
  var files = [];
  var filenames = fs.readdirSync(dirname);
  for(var i = 0; i < filenames.length; i++){
    var array = fs.readFileSync(dirname + filenames[i], 'utf-8').replace(/\r\n/g,'\n').split('\n');
    var split;
    if(fileExtension){
      split = filenames[i].lastIndexOf('.');
    }
    else{
      split = filenames[i].length;
    }
    files[i] = {'filename': filenames[i].substr(0, split), 'extension': filenames[i].substr(split + 1), 'content': makePairs(array)};
  }
  console.log("Files read!");
  return files;
}

function makePairs(data){
  var result = [];
  var j = 0;
  for(var i = 2; i < data.length; i++){
    var array = data[i].split(separator)
    if(array.length > 1){
      result[j] = [array[0].trim(), array[1].trim()];
      result[j][0] = formatDate(result[j][0]);
      result[j][1] = Number(result[j][1]);
      j++;
    }
  }
  return result;
}

function storeToDatabase(data, connection){
  for(var i = 0; i < data.length; i++){
    sql = "CREATE TABLE IF NOT EXISTS measurements (name VARCHAR(255))";
    connection.query(sql, function (err, result) {if (err) throw err;});
    var sql = "INSERT IGNORE INTO measurements (name) VALUES (?)";
    connection.query(sql, data[i].filename, function (err, result){if(err) throw err;});
    sql = "CREATE TABLE IF NOT EXISTS ?? (timestamp DATETIME(1) PRIMARY KEY, value DOUBLE)";
    connection.query(sql, data[i].filename, function (err, result) {if (err) throw err;});
    sql = "INSERT IGNORE INTO ?? (timestamp, value) VALUES ('" + data[i].content[0][0] + "', " + data[i].content[0][1] +")"
    for(var j = 1; j < data[i].content.length; j++){
      sql = sql + ", ('" + data[i].content[j][0] + "', " + data[i].content[j][1] +")";
    }
    connection.query(sql, [data[i].filename], function (err, result) {if (err) throw err;});
    var n = i + 1;
    console.log("Table "+ n +" stored!");
  }
  connection.end(function (err){
    if (err) throw err;
    console.log("Data stored!");
  });
}

function encodeFilenames(data){
  for(var i = 0; i < data.length; i++){
    data[i].filename = data[i].filename.replace(/%/g, '%25');
    data[i].filename = data[i].filename.replace(/\./g, '%2e');
  }
  return data;
}

function formatDate(dateString){
  dateString = dateString.trim();
  var split = dateString.lastIndexOf(' ');
  dateString = [dateString.substr(0, split), dateString.substr(split + 1)];
  var timeString = dateString[1].trim();
  dateString = dateString[0].trim();
  dateString = dateString.split("/");
  var day = dateString[0].trim();
  var month = dateString[1].trim();
  var year = dateString[2].trim();
  year = "20" + year;
  dateString = year + "-" + month + "-" + day;
  var date = dateString + " " + timeString;
  if(!/^(20[0-9][0-9]-[0-1][0-9]-[0-3][0-9] [0-2][0-9]:[0-5][0-9]:[0-5][0-9]\.[0-9])$/.test(date)) throw "Invalid date!";
  return date;
}

var data = readFiles(dirname);
data = encodeFilenames(data);

var connection = mysql.createConnection({
  host: params.host,
  port: params.port,
  user: params.user,
  password: params.password,
  database: params.database
});

storeToDatabase(data, connection);
