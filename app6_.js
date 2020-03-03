var express = require(`express`);
var http = require(`http`);
var static = require(`serve-static`);
var path = requrie(`path`);

var bodyParser = require(`body-parser`);
var cookieParser = requrie(`cookie-parser`);
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