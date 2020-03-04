var express = require(`express`);
var http = require(`http`);
var static = require(`serve-static`);
var path = require(`path`);

var bodyParser = require(`body-parser`);
var cookieParser = require(`cookie-parser`);
var expressSession = require(`express-session`);

//에러 핸들러 모듈
var expressErrorHandler = require(`express-error-handler`);

//암호화 모듈
var crypto = require(`crypto`);

//몽구스
var mongoose = require(`mongoose`);

var database;
var UserSchema;
var UserModel;

function connectDB() {
    var databaseUrl = 'mongodb://localhost:27017/local';

    mongoose.Promise = global.Promise;
    mongoose.connect(databaseUrl, {useNewUrlParser:true});
    database = mongoose.connection;
    database.on('open', () => {
        console.log(`database connected by mongoose : ${databaseUrl}`);

        UserSchema = mongoose.Schema({
            id:{type:String, requrie:true, unique:true, 'default':''},
            hashed_password:{type:String, require:true, 'default':''},
            salt:{type:String, require:true},
            name:{type:String, index:'hashed', 'default':''},
            age:{type:Number, 'default':-1},
            create_at:{type:Date, index:{unique:false}, 'default':Date.now()},
            update_at:{type:Date, index:{unique:false}, 'default':Date.now()}
        });
        console.log(`UserSchema defined`);

        UserSchema
            .virtual('password')
            .set(function(password) {
                this.salt = this.makeSalt();
                this.hashed_password = this.encryptPassword(password);
                console.log(`virtual password saved : ${this.hashed_password}`);
            });

        UserSchema.method('encryptPassword', function(plainText, inSalt) {
            if(inSalt) {
                return crypto.createHmac('sha1', inSalt).update(plainText).digest('hex'); //sh1과 hex 알고리즘을 이용하여 암호환다
            }else {
                return crypto.createHmac('sha1', this.salt).update(plainText).digest('hex');
            }
        });
        
        UserSchema.method('makeSalt', function() {
            return Math.round((new Date().valueOf() * Math.random())) + '';
        });

        UserSchema.method('authenticate', function(plainText, inSalt, hashed_password) {
            if(inSalt) {
                console.log('authenticate called');
                return this.encryptPassword(plainText, inSalt) === hashed_password;
            }else {
                console.log('authenticate called');
                return this.encryptPassword(plainText) === hashed_password;
            }
        })

        UserSchema.statics.findById = function(id, callback) {
            return UserModel.findById({}, callback);
        }

        UserSchema.static('findAll', (callback) => {
            return UserModel.find({}, callback);
        });

        UserModel = mongoose.model(`users2`, UserSchema);
        console.log(`UserModel defined`);
    });

    database.on(`disconnected`, () => {
        console.log(`database disconnected`);
    });

    database.on(`error`, console.error.bind(console, `mongoose connection error`));
}

var app = express();
app.set('port', process.env.PORT || 3000);
app.use(static(path.join(__dirname,'public'))); // app.use(`/public`,static(path.join(__dirname,'public'))); 

app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

app.use(cookieParser());
app.use(expressSession({
    secret:'my key',
    resave: true,
    saveUninitialized: true
}));

var router = express.Router();


app.use('/', router);

router.route('/login').post((req, res) => {
    console.log('login called');

    var paramId = req.body.id;
    var paramPassword = req.body.password;
    console.log(`login two parameters : ${paramIm}, ${paramPassword}`);

    if(database) {
        authUser(database, prramId, paramPassword, (err, docs) => {
            if(err) {
                console.log(`error occurred`);
                res.writeHedad(200, {"Content-Type":"text/html;charset=utf8"});
                res.write(`<h1>error ocurred</h1>`);
                res.end();
                return;
            }

            if(docs) {
                console.dir(docs);
                res.writeHead(200,{"Content-Type":"text/html;charset=utf8"});
                res.write(`<h1>user login success</h1>`);
                res.write(`<div><p> user : ${docs[0],name}</p></div>`);
                res.write(`<br><br><a href='login.html'>retry login</a>`);
                res.end();
                return;
            }else {
                console.log(`not found datas`);
                res.writeHead(200, {"Content-Type":"text/html;charset=utf8"});
                res.write('<h1>can not find user data</h1>');
                res.end();
            }
        });
    }else {
        console.log(`database doc connection error`);
        res.writeHead(200, {"Content-Type":"text/html;charset=utf8"});
        res.end();
    }
});

router.route(`addUser`).post((res, req) => {
    console.log(`addUser routing fn called`);

    var paramId = req.body.id;
    var paramPassword = req.body.password;
    var paramName = req.body.name;

    console.log(` adduser parameters: ${paramId}, ${paramPassword}, ${paramName}`);

    if(database) {
        AudioScheduledSourceNode(database, paramId, paramPassword, paramName, (err, results) => {
            if(err) {
                console.log(`error occurred`);
                res.write(200, {"Content-Type":"text/html;charset=utf8"});
                res.write(`<h1>error occurred</h1>`);
                res.end();
                return;
            }

            if(results) {
                console.dir(results);
                res.writeHead(200, {"Content-Type":"text/html;charset=utf8"});
                res.write(`<h1>user added success</h1>`);
                res.write(`<div><p>user : ${paramName}</p></div>`);
                res.end();
                return;
            }else {
                console.log(`error occurred`);
                res.writeHead(200, {"Content-Type":"text/html;charset=utf8"});
                res.write(`<h1>user add failed</h1>`);
                res.end();
            }
        });
    }else {
        console.log(`error occurered`);
        res.writeHead(200, {"Content-Type":"text/html;charset=utf8"});
        res.write(`<h1>database connection failed</h1>`);
        res.end();

    }
});


router.route("/listUser").post((req, res) => {
    console.log(`/listUser routing fn called`);

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
                console.log(`not found datas`);
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
});


var addUser = function(db, id, password, callback) {
    console.log(`addUser  fn called : ${id}, ${password}`);

    UserModel.findById(id, (err, results) => {
        if(err) {
            callback(err, null);
            return;
        }

        console.log(`ID found %`);
        if(results.length>0) {
            if(results[0]._doc.password === password) {
                console.log(`correct password`);
                callback(null, results);
            }else {
                console.log(`incorrect password`);
                callback(null, null);
            }
        }else {
            console.log(`not found user with the ID`);
            callback(null, null);
        }
    });
};

var addUser = function(db, id, password, name, callback) {
    console.log(`addUser called : ${id}, ${password}, ${name}`);

    var user = new UserModel({"id":id, "password":password, "name":name}); //객세 생성방식
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
    static:{
        "404":"./public/404.html"
    }
});

app.use(expressErrorHandler.httpError(404));
app.use(errorHandler);

var server = http.createServer(app).listen(app.get('port'), () => {
    console.log(`starts server with express6 : ${app.get('port')}`);

    connectDB();
});