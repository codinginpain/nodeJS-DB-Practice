var express = require(`express`);
var http = require(`http`);
var static = require(`serve-static`);
var path = require(`path`);

var bodyParser = require('body-parser');
var cookieParser = require(`cookie-parser`);
var expressSession = require(`express-session`);

//에러 핸들러 모듈 사용
var expressErrorHandler = require(`express-error-handler`);

//mongoose 모듈 사용
var mongoose = require(`mongoose`);

var database;
var UserSchema;
var UserModel;

function connectDB() {
    var databaseUrl = `mongodb://localhost:27017/local`;

    mongoose.Promise = global.Promise; //몽구스에서 설정을 이렇게 하라고 정해 놓음
    mongoose.connect(databaseUrl, {useNewUrlParser:true}); //몽고수 새로운 연결방식
    database = mongoose.connection;
    database.on('open', () => { //open 이라는 이벤트가 발생하면 연걸
        console.log(`database connected by moogse : ${databaseUrl}`);

        UserSchema = mongoose.Schema({
            id: {type:String, required:true, unique:true},
            password: {type:String, require:true},
            name: {type:String, index:'hashed'}, //hased 방식으로 index를 만든다
            age: {type:Number, 'default':-1},
            create_at: {type:Date, index:{unique:false}, 'default':Date.now()},
            update_at: {type:Date, index:{unique:false}, 'default': Date.now()}
        });
        console.log(`UserSchema 정의완료`);

        UserSchema.static('findById', (id, callback) => {
            console.log(` 1 : ${this}`);
            return UserModel.find({id:id}, callback); //this ri UserModel 을 참조하는 것일듯?
        });

        UserSchema.statics.findById = (id, callback) => { console.log(this); return UserModel.find({}, callback);} // 이렇게 하면 바로 위 함수랑 같음

        UserSchema.static('findAll', (callback) => {
            console.log(` 3 : ${this}`);
            return UserModel.find({}, callback);
        });

        UserModel = mongoose.model(`users2`, UserSchema); //여기서 모델이 만들어짐 (위에 shcema에서 함수나 스키마들을 정의하고 model 에서 사용 할수 있게 만들어짐)
        console.log(`UserModel 정의`);
    });

    database.on(`disconnected`, () => {
        console.log(`데이터베이스 연결 끊어짐`);
    });

    database.on(`error`, console.error.bind(console, `mongoose 연결 에러`));
}

var app = express();
app.set(`port`, process.env.PORT || 3000);
app.use(static(path.join(__dirname,'public'))); // app.use(`/public`,static(path.join(__dirname,'public'))); 


app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

app.use(cookieParser());
app.use(expressSession({
    secret: `my key`,
    resave: true,
    saveUninitialized: true
}));

var router = express.Router();



app.use(`/`, router);

router.route(`/login`).post((req, res) => {
    console.log(`/login called`);

    var paramId = req.body.id;
    var paramPassword = req.body.password;
    console.log(`two parameters : ${paramId}, ${paramPassword}`);

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
    console.log(`addUser routing fn called`);

    var paramId = req.body.id;
    var paramPassword = req.body.password;
    var paramName = req.body.name;

    console.log(`parameters : ${paramId}, ${paramPassword}, ${paramName}`);

    if(database) {
        addUser(database, paramId, paramPassword, paramName, (err, results) => {
            if(err) {
                console.log(`error 발생`);
                res.writeHead(200, {"Content-Type":"text/html;charset=utf8"});
                res.write(`<h1>에러 발생</h1>`);
                res.end();
                return;
            }

            if(results) {
                console.dir(results);
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


router.route("/listuser").post((req, res) => {
    console.log(`/listuser 라우팅 함수 호출 됨.`);

    if(database) {
        UserModel.findAll((err, results) => {
            if(err) {
                console.log(`error 발생`);
                res.writeHead(200, {"Content-Type":"text/html;charset=utf8"});
                res.write(`<h1>에러 발생</h1>`);
                res.end();
                return;
            }

            if(results) {
                console.dir(results);
                res.writeHead(200, {"Content-Type":"text/html;charset=utf8"});
                res.write("<h3>사용자 리스트</h3>");
                res.write("div><ul>");

                for(var i=0; i<results.length; i++) {
                    var curId = results[i]._doc.id;
                    var curname = results[i]._doc.name;
                    res.write(`    <li>#4${i} -> ${curId}, ${curName} </li>`);
                }

                res.write(`</ul></div>`);
                res.end();
            }else {
                console.log(`조회 자료  없음`);
                res.writeHead(200, {"Content-Type":"text/html;charset=utf8"});
                res.write(`<h1>사용자 데이터 조회 되지 않음</h1>`);
                res.end();
            }
        });
    }else {
        console.log(`error 발생`);
        res.writeHead(200, {"Content-Type":"text/html;charset=utf8"});
        res.write(`<h1>database 연결 안됨</h1>`);
        res.end();
        return;
    }
})



var authUser = (db, id, password, callback) => {
    console.log(`addUser called : ${id}, ${password}`);

    UserModel.findById(id, (err, results) => {
        if(err) {
            callback(err, null);
            return;
        }

        console.log(`아이디 %s로 검색 됨`);
        if(results.length > 0) { //1개라도 결과가 있을 때
            if(results[0]._doc.password === password) {
                console.log(`비밀번호 일치함`);
                callback(null, results);
            }else {
                console.log(`비밀번호 일치하지 않음`);
                callback(null, null);
            }
        }else {
            console.log(`아이디 일치하는 사용자 없음`);
            callback(null, null);
        }
    });

    UserModel.find({"id":id, "password":password}, (err, docs) => {
        if(err) {
            callback(err, null);
            return;
        }

        if(docs.length > 0) {
            console.log(`found the user`);
            callback(null, docs);
        }else {
            console.log(`can not find the user`);
            callback(null, null);
        }
    });
};

var addUser = (db, id, password, name, callback) => {
    console.log(`addUser called : ${id}, ${password}, ${name}`);

    var user = new UserModel({"id":id, "password":password, "name":name}); //객체 생성방식
    user.save((err) => {
        if(err) {
            callback(err, null);
            return;
        }
        console.log(`added new user data`);
        callback(null, user);
    });
};

var errorHandler = expressErrorHandler({
    static: {
        '404': './public/404.html'
    }
});

app.use(expressErrorHandler.httpError(404));
app.use(errorHandler);

var server = http.createServer(app).listen(app.get(`port`), () => {
    console.log(`starts server with express : ${app.get(`port`)}`);

    connectDB();
});
