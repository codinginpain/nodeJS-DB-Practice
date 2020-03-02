var mongoose = require(`mongoose`);

var database;
var UserSchema;
var UserModel;

function connectDB() {
    var databaseUrl = "mongodb://localhost:27017/local";

    mongoose.Promise = global.Promise;
    mongoose.connect(databaseUrl, {useNewUrlParser:true});
    database = mongoose.connection;

    database.on('open', () => { //open -> database가 연결되면~
        console.log(`connected database : ${databaseUrl}`);

        createUserSchema();

        doTest();
    });

    database.on('disconnectd', () => {
        console.log(`database disconnected`);
    });

    database.on('error', console.error.bind(console, 'mongoose connection error'));
}

function createUserSchema() {
    UserSchema = mongoose.Schema({
        id:{type:String, require:true, unique:true},
        //password 뺌
        name:{type:String, index:'hased'},
        age:{type:Number, 'default':-1},
        create_at:{type:Date, index:{unique:false}, 'default':Date.now()},
        update_at:{type:Date, index:{unique:false}, 'default':Date.now()}
    });
    console.log(`UserSchema defined`);

    UserSchema
        .virtual('info')
        .set(function (info) {
            var splitted = info.split(` `);
            console.log("this");
            console.log(this);
            this.id = splitted[0]; //this는 UserSchema
            this.name = splitted[1];
            console.log(`virtual info attribute set : ${this.id}, ${this.name}`);
        })
        .get(function()  {
            console.log("get 실행");
            return this.id + ' ' + this.name});

    UserModel = mongoose.model("users4", UserSchema);
    console.log(`UserModel defined`);
    console.log("get : " + UserSchema.virtual('info').get()); 
    console.log(UserSchema.virtual('info').get());       
}

function doTest() {
    var user = new UserModel({"info":"test02 걸스데이"});

    user.save((err) => { //save가 실행 되고 콜백으로 err 받게 설정
        if(err) {
            console.log(`error occurred`);
            console.log(err);
            return;
        }
        console.log('data added');
    });
}

connectDB();
