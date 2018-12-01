//引入模块
const MongoClient = require('mongodb').MongoClient;

const Config = require('./config.js');

const objectId = require('mongodb').ObjectID;

//创建类
class Db {

    //构造函数
    constructor() {

        //设置连接状态
        this.isConnect = '';

        //实例化的时候连接数据库
        this.connect();

    }

    //数据库连接
    connect() {

        return new Promise((resolve, reject) => {

            if (!this.isConnect) {
                //数据库连接操作
                MongoClient.connect(Config.url, (err, client) => {

                    if (err) {
                        reject(err);
                    } else {

                        //创建数据库执行对象
                        const db = client.db(Config.dbname);
                        resolve(db);
                    }
                })
            }else{
                resolve(this.isConnect);
            }
        })

    }

    //读取
    find(cname, json) {

        return new Promise((resolve, reject) => {

            //数据库连接
            this.connect().then((db) => {

                const datas = db.collection(cname).find(json);

                datas.toArray((err, docs) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(docs);
                    }
                })
            })
        })

    }

    //新增
    insert(cname, json) {

        return new Promise((resolve, reject) => {
            //连接数据库
            this.connect().then((db) => {

                db.collection(cname).insertOne(json, (err, result) => {
                    if (err) {
                        reject(err)
                    } else {
                        resolve(result)
                    }
                })
            })
        })

    }

    //修改
    edit(cname, json1, json2) {

        return new Promise((resolve, reject) => {

            //连接数据库
            this.connect().then((db) => {

                db.collection(cname).updateOne(json1, json2, (err, res) => {

                    if (err) {
                        reject(err);
                    } else {
                        resolve(res);
                    }
                })
            })
        })
    }

    //删除
    delete(cname, json) {

        return new Promise((resolve, reject) => {

            this.connect().then((db) => {
                db.collection(cname).removeOne(json, (err, result) => {

                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                })
            })
        })
    }

    //解析ID
    ObjectId(id) {
        return objectId(id);
    }

}

module.exports = new Db();