COCOP Process Data Simulator
============================

---

<img src="logos.png" alt="COCOP and EU" style="display:block;margin-right:auto" />

COCOP - Coordinating Optimisation of Complex Industrial Processes  
https://cocop-spire.eu/

This project has received funding from the European Union's Horizon 2020
research and innovation programme under grant agreement No 723661. This piece
of software reflects only the authors' views, and the Commission is not
responsible for any use that may be made of the information contained therein.

---


Author
------

Antti Kätkytniemi, Tampere University, Finland

**Please make sure to read and understand [LICENSE.txt](./LICENSE.txt)!**


COCOP Toolkit
-------------

This application is a part of COCOP Toolkit, which was developed to enable a
decoupled and well-scalable architecture in industrial systems. Please see
https://kannisto.github.io/Cocop-Toolkit/


Introduction
------------

This sofware application was created as a part of the research project COCOP.
The purpose is to be able to read data from CSV files with one process and
push this data to AMQP message bus with other process.

Using the CSV file reader a MariaDB (or MySQL) database for storing data should
be installed and be running somewhere. The publisher part also needs AMQP
message bus for sending the data.

**Note: configuration files must be filled before using**

CSV file rows should look like (**note the time format**):
```
31/01/18 17:20:30.8; 2.564
```

CSV file reader can read multiple files located in same directory.

Pushing process has REST interface for starting and stopping the process.
Sending a HTTP POST to URL for server with JSON as a payload that includes
tables that should be pushed, interval for how often the push is made as
milliseconds and speedup multiplier for getting data from database faster
than it is pushed. PID for stopping the process is given as result. Sending
a HTTP DELETE to url for server /pid given stops the process
(for example http://server.url:3000/9045).

This has two version of the publisher: one for publishing only content from one
table and one for publishing from multiple tables.

Example payloads of the HTTP POST for one table (upper one) and multiple tables
(lower one):
```json
{
	"table": "table_the_data_is",
	"interval": 1000,
	"speedup": 10
}

{
	"tables": [
		"table1",
    "table2"
	],
	"interval": 10000,
	"speedup": 1
}
```

Starting the reader use command "node read.js read.config" in command line.

Starting the publisher use command "node push_rest.js push.config" or
"node push_rest_multi.js push.config" in command line.

All message structures are based on existing open standards. In this API, the
standards have been created by and are copyrighted to the Open Geospatial
Consortium, Inc. (OGC(r)); https://www.ogc.org/). However, OGC is _not_ the
creator of this software, and this software has _not_ been certified for
compliance with any OGC standard.

See also:

* Github repo: (the planned URL in Github)


Environment and Libraries
-------------------------

The development environment was Atom.

The runtime was NodeJs (version 10.15.3).

This distribution does not include any external NodeJs libraries. These are the
following:

For csv reader:
* mysql

For rest interface:
* express

For publisher:
* mysql
* amqplib
* xmlbuilder
