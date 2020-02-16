var express = require(`express`);
var http = require('http');
var static = require('serve-static');
var path = require(`path`);


var bodyParser = require(`body-parser`);
var cookieParser = require(`cookie-parser`);
var expressSession = require(`express-session`);

//에러 핸들러 모듈 사용
var expressErrorHandler = require(`express-error-handler`);

//mongodb 모듈 사용
var mongoClient = require(`mongodb`).MongoClient;

var database;

function connectDB() {
    var databaseUrl = 'mongodb://localhost:27017/local';

    MongoClient.connect(databaseUrl, (err, db) => {
        if(err) {
            console.log('failed database connect');
            return;
        }
        console.log(`successfully conected database : ${databaseUrl}`);
        database = db;
    });
}




var app = express();
app.set(`port`, process.env.PORT || 3000); //app객체에 set을 해서 port 속성 설정
app.use(`/public`, static(path.join(__dirname, `public`)));//public folder를 접근 가능하게 오픈

app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

app.use(cookieParser());
app.use(expressSession({
    secret:'my key',
    resave:true,
    saveUninitialized:true
}));


var router = express.Router();

app.use(`/`, router);

//404 에러 페이지 처리
var errorHandler = expressErrorHandler({
    static : {
        '404' : './public/404.html'
    }
});

app.use(expressErrorHandler.httpError(404));
app.use(errorHandler);

var server = http.createServer(app).listen(app.get(`port`), () => {
    console.log(`starts server with express : ${app.get(`port`)}`);

    connectDB();
})



