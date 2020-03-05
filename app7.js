//npm install mysql --save

var express = require('express');
var http = require('http');
var static = require('serve-static');
var path = require('path');

var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var expressSession = require('express-session');

var expressErrorHandler = require('express-error-handler');

var mysql = require('mysql');

var pool = mysql.createPool({ //pool을 사용하여 db connection 갯수를 정해놓고 재활용
    connectionLimit:10,
    host:'localhost',
    user:'root',
    password:'wjdrl123#',
    database:'test',
    debug:false
});



var app = express();

app.set(`port`, process.env.PORT || 3000);
app.use(static(path.join(__dirname, `public`)));
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(expressSession({secret:'my key', resave:true, saveUninitialized:true}));

var router = express.Router();

app.use('/', router);

router.route('/adduser').post((req, res) => {
    console.log(`/addUser routing fn called`);

    var paramId = req.body.id;
    var paramPassword = req.body.password;
    var paramName = req.body.name;
    var paramAge = req.body.age;

    console.log(`called parameters : ${paramId}, ${paramPassword}, ${paramName}, ${paramAge}`);

    addUser(paramId, paramName, paramAge, paramPassword, (err, addedUser) => {
        if(err) {
            console.log(`error occurred`);
            res.writeHead(200, {"Content-Type:":"text/html;charset=utf8"});
            res.write(`<h1>error occurred</h1>`);
            res.end();
            return;
        }

        if(addedUser) {
            console.dir(addedUser);
            res.writeHead(200, {"Content-Type":"text/html;charset=utf8"});
            res.write(`<h1>user added</h1>`);
            res.end();
        }else {
            console.log(`error occurred`);
            res.writeHead(200, {"Content-Type:":"text/html;charset=utf8"});
            res.write(`<h1>can not add user</h1>`);
            res.end();
        }
    });
})



var addUser = function(id, name, age, password, callback) {
    console.log('addUser called');
    pool.getConnection((err, conn) => {
        if(err) {
            if(conn) {
                conn.release(); //pool로 반납 매우중요
            }
            callback(err, null);
            return;
        }
        console.log(`db connection thread id : ${conn.threadId}`);

        var data = {id:id, name:name, age:age, password:password};
        var exec = conn.query('insert into users set ?', data, (err, result) => {
            conn.release();
            console.dir(exec);
            console.log(`excuted sql : ${exec.sql}`);

            if(err) {
                console.log(`sql error occurred`);
                callback(err, null);
                return;
            }

            callback(null, result);
        });
    });
};


var server = http.createServer(app).listen(app.get('port'), function() {
    console.log(`server starts with express web : ${app.get('port')}`);
})


