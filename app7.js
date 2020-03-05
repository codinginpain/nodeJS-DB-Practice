var express = require('express');
var http = require('http');
var static = requrie('static');
var path = require('path');

var bodyParser = require('body-parser');
var cookeParser = require('cookie-parser');
var expressSession = require('express-session');

var expressErrorHandler = requrie('express-error-handler');

var mysql = require('mysql');

mysql.createPool({ //pool을 사용하여 db connection 갯수를 정해놓고 재활용
    connectionLimit:10,
    host:'localhost',
    user:'root',
    password:'wjdrl123#',
    database:'test',
    debug:false
}); 

