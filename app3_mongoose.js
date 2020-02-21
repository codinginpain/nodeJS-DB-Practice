var express = require(`express`);
var http = require(`http`);
var static = require(`serve-static`);
var path = require(`path`);

var bodyParser = require(`body-parser`);
var cookeParser = require(`cookie-parser`);
var expressSession = require(`express-session`);

//에러 핸들러 모듈 사용
var expressErrorHandler = require(`express-error-handler`);

//mongoose모듈 사용
var mongoose =require(`mongoose`);

var database;
var userSchema;
var userModel;

function connectDB() {
    var databaseUrl = `mongodb://localhost:27017/local`;

    mongoose.Promise = global.Promise; //몽구스에서 설정을 이렇게 해달라고 정해놓음
    mongoose.connect(databaseUrl, {useNewUrlParser : true}); //새로운 몽구스 연결 방식 {useNewUrlParser : true} 추가로 던져야함
    database = mongoose.connection;
    database.on('open', () => { //open이라는 이벤트가 발생 했을때 연결
        console.log(`database connected by mongoose : ${databaseUrl}`);

        userSchema = mongoose.Schema({
            id: String,
            name: String,
            password: String
        });
        console.log(`userSchema 정의함.`);

        userModel = mongoose.model(`users`, userSchema);
        console.log(`userModel 정의함.`);
    });

    database.on(`disconnected`, () => {
        console.log(`데이터베이스 연결 끊어짐`);
    });

    database.on(`error`, console.error.bind(console, `mongoose 연결 에러`));

    
}

var app = express();
app.set(`port`, process.env.PORT || 3000); 
app.use(`/public`, static(path.join(__dirname, 'public')));

app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

app.use(cookeParser());
app.use(expressSession({
    secret:'my key',
    resave:true,
    saveUninitialized:true
}));

var router = express.Router();

app.use(`/`, router);

router.route(`/login`).post((req, res) => {
    console.log(`/login 요청 들어옴`);

    var paramId = req.body.id;
    var paramPassword = req.body.password;
    console.log(`요청 파라미터 2개 : ${paramId}, ${paramPassword}`);

    if(database) {
        authUser(database, paramId, paramPassword, (err, docs) => {
            if(err) {
                console.log(`에러 발생`);
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
                console.log(`조회 자료  없음`);
                res.writeHead(200, {"Content-Type":"text/html;charset=utf8"});
                res.write(`<h1>사용자 데이터 조회 되지 않음</h1>`);
                res.end();
            }
        });

    }else {
        console.log(`database doc 연결 안됨`);
        res.writeHead(200, {"Content-Type":"text/html;charset=utf8"});
        res.write(`<h1>데이터베이스 연결 안됨</h1>`);
        res.end();
    }
});


router.route(`/addUser`).post((req, res) => {
    console.log(`addUser routing fn calle`);

    var paramId = req.body.id;
    var paramPasswrod = req.body.password;
    var paramName = req.body.name;

    console.log(`addUser 요청 파라미터 : ${paramId}, ${paramPasswrod}, ${paramName}`);

    if(database) {
        addUser(database, paramId, paramPasswrod, paramName, (err, result) => {
            if(err) {
                console.log(`error 발생`);
                res.writeHead(200, {"Content-Type":"text/html;charset=utf8"});
                res.write(`<h1>에러 발생</h1>`);
                res.end();
                return;
            }

            if(result) {
                console.dir(result);
                res.writeHead(200, {"Content-Type":"text/html;charset=utf8"});
                res.write(`<h1>사용자 추가 성공</h1>`);
                res.write(`<div><p>사용자 : ${paramName}</p></div>`);
                res.end();
                return;
            }else {
                console.log(`error 발생`);
                res.writeHead(200, {"Content-Type":"text/html;charset=utf8"});
                res.write(`<h1>사용자 추가 안됨</h1>`);
                res.end();
            }
        });
    }else {
        console.log(`error 발생`);
        res.writeHead(200, {"Content-Type":"text/html;charset=utf8"});
        res.write(`<h1>데이터베이스 연결 안됨</h1>`);
        res.end();
    }
});


var authUser = (db, id, password, callback) => {
    console.log(`authUser called : ${id}, ${password}`);

    userModel.find({"id":id, "password":password}, (err, docs) => {
        if(err) {
            callback(err, null);
            return;
        }

        if(docs.length > 0) {
            console.log("일치 하는 사용자 있음");
            callback(null, docs);
        }else {
            console.log("일치하는 자료 없음");
            callback(null, null);
        }
    });

};

var addUser = (db, id, password, name, callback) => {
    console.log(`addUser called : ${id}, ${password}, ${name}`);

    var user = new userModel({"id":id, "password":password, "name":name}); //객체 생성 방식
    user.save((err) => {
        if(err) {
            callback(err, null);
            return;
        }
        console.log("사용자 데이터 추가함");
        callback(null, user);
    });
};


var errorHandler = expressErrorHandler({
    statc : {
        '404' : './public/404.html'
    }
});

app.use(expressErrorHandler.httpError(404));
app.use(errorHandler);

var server = http.createServer(app).listen(app.get(`port`), () => {
    console.log(`starts server with exrpess : ${app.get(`port`)}`);

    connectDB();
})

