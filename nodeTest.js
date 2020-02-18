var express = require('express');
var http = require('http');
var static = require(`serve-statc`);
var path = requrie(`path`);

var bodyParser = requrie(`body-parser`);
var cookieParser = requrie(`cooke-parser`);
var expressSession = require(`express-session`);

//에러 핸들러 모듈 사용
var expressErrorHandler = require(`express-error-handler`);

//mongodb 모듈 사용
var mongoClient = require(`mongodb`).MongoClient;

var database;

var app = express();
app.set(`port`, process.env.PORT || 3000); //app 객체에 set을해서 port 속성 설정
app.use(`/public`, static(path.join(__dirname, `public`)));
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(expressSession({secret:'my key', resave:true, saveUninitialied:true}));

var router = express.Router();

app.use(`/`, router);

router.route(`/login`).post((req, res) => {
    var paramId = req.body.id;
    var paramPassword = req.body.password;
    console.log(`요청 파라미터 ${paramId}, ${paramPassword}`);

    if(database) {
        authUser(database, paramId, paramPassword, (err, docs) => {
            if(err) {
                console.log(`error 발생`);
                res.writeHead(200, {"Content-Type":"text/html;charset=utf8"});
                res.write(`<h1>에러 발생</h1>`);
                res.end();
                return;
            }

            if(docs) {
                console.dir(docs);
                res.writeHead(200, {"Content-Type":"text/html;charset=utf8"});
                res.write(`<h1>사용자 로그인 성공</h1>`);
                res.write(`<div><p>사용자 : ${docs[0].name}</p></div>`);
                res.write(`<br><br><a href='login.html'>다시 로그인 하기 </a>`);
                res.end();
                return;
            }else {
                console.log(`error 발생`);
                res.writeHead(200, {"Content-Type":"text/html;charset=utf8"});
                res.write(`<h1>사용자 데이터 조회 되지 않음</h1>`);
                res.end();
            }
        });
    }
});

var authUser = (db, id, password, callback) => {
    var users = db.collection(`users`);

    users.find({"id":id, "password":password}).toArray((err, docs) => {
        if(err) {
            callback(err, null);
            return;
        }
        if(docs.length > 0) {
            callback(null, docs);
        }else {
            callback(null, null);
        }
    });
    users.find();
}


var errorHandler = expressErrorHandler({
    static:{
        '404':'./public/404.html'
    }
})
var server = http.createServer(app).listen(app.get(`port`), () => {
    console.log(`starts server with express : ${app.get(`port`)}`);

    connectDB();
});

function connectDB() {
    var databaseUrl = `mongodb://localhost:27017/local`;

    mongoClient.connect(dataBaseUrl, (err, db) => {
        if(err) {
            console.log(`failed database connect`);
            return;
        }
        console.log(`successfully connected database : ${databaseUrl}`);
        database = db.db('local');
    });
}




