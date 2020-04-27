//
// Please make sure to read and understand README.md and LICENSE.txt.
//
// This file was prepared in the research project COCOP (Coordinating
// Optimisation of Complex Industrial Processes).
// https://cocop-spire.eu/
// Author: Antti Kätkytniemi, Tampere University, Finland
// Last modified: 4/2020
//
// This application has been derived from standards and XML schemata provided
// by the Open Geospatial Consortium (OGC(r)). Please make sure to read and
// understand the following legal conditions:
// (1) Copyright Notice and Disclaimers at https://www.ogc.org/ogc/legal
// (2) OGC(r) Document Notice; the most recent version is at
//     https://www.ogc.org/ogc/document and another enclosed in file
//     "ogc_document_notice.txt"
// (3) OGC(r) Software Notice; the most recent version is at
//     https://www.ogc.org/ogc/software and another enclosed in file
//     "ogc_software_notice.txt"
// (4) The license of each related standard. Please see
//     "ref_and_license_gml.txt", "ref_and_license_om.txt",
//     "ref_and_license_swe.txt", " ref_and_license_sos.txt" and
//     "ref_and_license_filter.txt".

"use strict";

var mysql = require('mysql');
var amqp = require('amqplib/callback_api');
var builder = require('xmlbuilder');

var fs = require('fs');

var args = [];

for(var i = 0; i < process.argv.length - 2; ++i){
  args[i] = process.argv[i + 2];
}

var params = JSON.parse(args[0]);
var connparams = JSON.parse(args[1]);
var firstime = true;
var first;

var opts = {
  ca: [fs.readFileSync(connparams.cert)]
};

var dBconnection = mysql.createConnection({
  host: connparams.host,
  port: connparams.port,
  user: connparams.user,
  password: connparams.password,
  database: connparams.database,
  dateStrings: true
});

var amqpchannel;
var ex = connparams.exchange;
var amqpconnection;
//'amqps://cocop-tut-obfus:Myth10viesti@amqp.ain.rd.tut.fi:5671'
amqp.connect(connparams.amqpprotocol+'://'+connparams.amqpuser+':'+connparams.amqppassword+'@'+connparams.amqphost+':'+connparams.amqpport, opts, function(err, conn) {
  if(err) throw err;
  amqpconnection = conn;
  amqpchannel = conn.createChannel(function(err, ch){
    if(err) throw err;
    amqpchannel.assertExchange(ex, 'topic');
  });
});

function decodeFilename(filename){
  filename = filename.replace(/%2e/g, '\.');
  filename = filename.replace(/%25/g, '%');
  return filename;
}

function encodeFilename(filename){
  filename = filename.replace(/%/g, '%25');
  filename = filename.replace(/\./g, '%2e');
  return filename;
}

function addMilliseconds(dateString, milliseconds){
  dateString = dateString.trim();
  var split = dateString.lastIndexOf(' ');
  dateString = [dateString.substr(0, split), dateString.substr(split + 1)];
  var timestring = dateString[1].trim();
  dateString = dateString[0].trim();
  dateString = dateString.split("-");
  var year = dateString[0].trim();
  var month = dateString[1].trim();
  var day = dateString[2].trim();
  timestring = timestring.split(":");
  var h = timestring[0].trim();
  var m = timestring[1].trim();
  var s = timestring[2].trim();
  s = s.split(".");
  var ms = s[1].trim();
  s = s[0].trim();
  var date = new Date(Number(year), Number(month) - 1, Number(day), Number(h), Number(m), Number(s), Number(ms)*100);
  date.setMilliseconds(Number(date.getMilliseconds()) + Number(milliseconds));
  return "" + date.getFullYear() + "-" + addZero((date.getMonth() + 1)) + "-" + addZero(date.getDate()) + " " + addZero(date.getHours()) + ":" + addZero(date.getMinutes()) + ":" + addZero(date.getSeconds()) + "." + addZero(parseInt(date.getMilliseconds()/10));
}

function addZero(i) {
    if (i < 10) {
        i = "0" + i;
    }
    return i;
}

function compareDatesLess(firstDate, secondDate){
  firstDate = firstDate.trim();
  var split = firstDate.lastIndexOf(' ');
  firstDate = [firstDate.substr(0, split), firstDate.substr(split + 1)];
  var timestring = firstDate[1].trim();
  firstDate = firstDate[0].trim();
  firstDate = firstDate.split("-");
  var year1 = firstDate[0].trim();
  var month1 = firstDate[1].trim();
  var day1 = firstDate[2].trim();
  timestring = timestring.split(":");
  var h1 = timestring[0].trim();
  var m1 = timestring[1].trim();
  var s1 = timestring[2].trim();
  s1 = s1.split(".");
  var ms1 = s1[1].trim();
  s1 = s1[0].trim();
  firstDate = secondDate.trim();
  split = firstDate.lastIndexOf(' ');
  firstDate = [firstDate.substr(0, split), firstDate.substr(split + 1)];
  timestring = firstDate[1].trim();
  firstDate = firstDate[0].trim();
  firstDate = firstDate.split("-");
  var year2 = firstDate[0].trim();
  var month2 = firstDate[1].trim();
  var day2 = firstDate[2].trim();
  timestring = timestring.split(":");
  var h2 = timestring[0].trim();
  var m2 = timestring[1].trim();
  var s2 = timestring[2].trim();
  s2 = s2.split(".");
  var ms2 = s2[1].trim();
  s2 = s2[0].trim();
  if(Number(year1) < Number(year2)){
    return true;
  }else if (Number(year1) == Number(year2) && Number(month1) < Number(month2)) {
    return true;
  }else if (Number(year1) == Number(year2) && Number(month1) == Number(month2) && Number(day1) < Number(day2)) {
    return true;
  }else if (Number(year1) == Number(year2) && Number(month1) == Number(month2) && Number(day1) == Number(day2) && Number(h1) < Number(h2)) {
    return true;
  }else if (Number(year1) == Number(year2) && Number(month1) == Number(month2) && Number(day1) == Number(day2) && Number(h1) == Number(h2) && Number(m1) < Number(m2)) {
    return true;
  }else if (Number(year1) == Number(year2) && Number(month1) == Number(month2) && Number(day1) == Number(day2) && Number(h1) == Number(h2) && Number(m1) == Number(m2) && Number(s1) < Number(s2)) {
    return true;
  }else if (Number(year1) == Number(year2) && Number(month1) == Number(month2) && Number(day1) == Number(day2) && Number(h1) == Number(h2) && Number(m1) == Number(m2) && Number(s1) == Number(s2) && Number(ms1) < Number(ms2)) {
    return true;
  }else{
    return false;
  }
}

function datestringtoiso(dateString){
  dateString = dateString.trim();
  var split = dateString.lastIndexOf(' ');
  dateString = [dateString.substr(0, split), dateString.substr(split + 1)];
  var timestring = dateString[1].trim();
  dateString = dateString[0].trim();
  dateString = dateString.split("-");
  var year = dateString[0].trim();
  var month = dateString[1].trim();
  var day = dateString[2].trim();
  timestring = timestring.split(":");
  var h = timestring[0].trim();
  var m = timestring[1].trim();
  var s = timestring[2].trim();
  s = s.split(".");
  var ms = s[1].trim();
  s = s[0].trim();
  var date = year + '-' + month + '-' + day + 'T' + h + ':' + m + ':' + s + '.' + ms + '0';
  return date;
}

function push(firstValue, lastValue){
  if(firstime){
    first = firstValue;
    firstime = false;
  }
  var last = addMilliseconds(first, params.interval * params.speedup);
  var sql = "SELECT * FROM ?? WHERE (timestamp >= ? AND timestamp < ?)";
  dBconnection.query(sql, [encodeFilename(params.table), first, last], function (err, result) {
    if (err) throw err;
    var test = first;
    if(result.length != 0){
      for(var i = 0; i < result.length; ++i){
        var xml = {
          'om:OM_Observation': {
            '@gml:id': params.table,
            '@xmlns:om': "http://www.opengis.net/om/2.0",
            '@xmlns:xsi': "http://www.w3.org/2001/XMLSchema-instance",
            '@xmlns:xlink': "http://www.w3.org/1999/xlink",
            '@xmlns:gml': "http://www.opengis.net/gml/3.2",
            '@xsi:schemaLocation': "http://www.opengis.net/om/2.0 http://schemas.opengis.net/om/2.0/observation.xsd",
            'om:type': {
              '@xlink:href': "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Measurement"
            },
            'om:phenomenonTime': {
              'gml:TimeInstant': {
                '@gml:id': "phenomenonTimeInstant",
                'gml:timePosition': datestringtoiso(result[i].timestamp)
              }
            },
            'om:resultTime': {
              'gml:TimeInstant': {
                '@gml:id': "resultTimeInstant",
                'gml:timePosition': datestringtoiso(result[i].timestamp)
              }
            },
            'om:result': {
              '@xsi:type': "gml:MeasureType",
              '@uom':"t",
              '#text': result[i].value
            }
          }
        }

        var msg = builder.create(xml, {encoding: 'UTF-8'}).end();
        amqpchannel.publish(ex, '', Buffer.from(msg));
      }
    }
    if(compareDatesLess(lastValue, test)){
      clearInterval(interval);
      setTimeout(function (){amqpconnection.close(); process.exit();}, params.interval);
    }
  });
  first = last;
}

var interval = {};

function pushData(){
  var sql = "SELECT timestamp as first FROM ?? ORDER BY 1 LIMIT 1";
  dBconnection.query(sql, encodeFilename(params.table), function (err, result) {
    if (err) throw err;
    var firstValue = result[0].first;
    var sql = "SELECT timestamp as last FROM ?? ORDER BY 1 DESC LIMIT 1";
    dBconnection.query(sql, encodeFilename(params.table), function (err, result) {
      if (err) throw err;
      interval = setInterval(push, params.interval, firstValue, result[0].last);
    });
  });
}

pushData();
