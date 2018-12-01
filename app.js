//引入模块
const Koa = require('koa'),                 //核心模块
    router = require('koa-router')(),       //路由模块
    render = require('koa-art-template'),   //模板模块
    static = require('koa-static'),         //静态资源模块
    path = require('path'),                 //路径模块
    fs = require('fs'),                     //文件处理模块
    session = require('koa-session'),
    koaBody = require('koa-body'),
    MongoClient = require('mongodb').MongoClient; //mongodb控制模块


const DB = require('./modules/db');
const admin = require('./routers/admin');    //路由模块



//实例化Koa对象
const app = new Koa();

//配置session
app.keys = ['some secret hurr'];

const CONFIG = {
    key: 'koa:sess', /** (string) cookie key (default is koa:sess) */
    /** (number || 'session') maxAge in ms (default is 1 days) */
    /** 'session' will result in a cookie that expires when session/browser is closed */
    /** Warning: If a session cookie is stolen, this cookie will never expire */
    maxAge: 86400000,
    autoCommit: true, /** (boolean) automatically commit headers (default true) */
    overwrite: true, /** (boolean) can overwrite or not (default true) */
    httpOnly: true, /** (boolean) httpOnly or not (default true) */
    signed: true, /** (boolean) signed or not (default true) */
    rolling: true, /** (boolean) Force a session identifier cookie to be set on every response. The expiration is reset to the original maxAge, resetting the expiration countdown. (default is false) */
    renew: false, /** (boolean) renew session when session is nearly expired, so we can always keep user logged in. (default is false)*/
};

app.use(session(CONFIG, app));
//配置模板引擎
render(app, {
    root: path.join(__dirname, 'views'),
    extname: '.html',
    debug: process.env.NODE_ENV !== 'production'
});


//配置bodyparser
// app.use(BodyParser());

//配置静态资源
app.use(static('statics'))

//配置文件上传模块
app.use(koaBody({
    multipart: true,
    formidable: {
        maxFileSize: 200 * 1024 * 1024    // 设置上传文件大小最大限制，默认2M
    }
}));

/////////////////////////////////////////////////\

//首页
router.get('/',async (ctx)=>{

  let result=  await DB.find('book',{});
//   console.log(result)

    await ctx.render('index',{res:result});
})

//后台
router.use('/admin',admin)



//处理微信小程序发送的数据
router.post('/wxdata',async(ctx)=>{
    //接收表单数据
    let data=ctx.request.body;
 
    console.log(data)

    const file = ctx.request.files.file;//file是文件域的name值
 
    if(file.name){ //如果上传了文件，才上传

        //创建读文件流
        let fileReadStream = fs.createReadStream(file.path);

        //创建上传的文件目录和文件名
        var filepath = 'statics/upload/'+file.name;

        //创建写入流
       let fileWriteStream = fs.createWriteStream(filepath);

        //架设管道流
        fileReadStream.pipe(fileWriteStream);
    
    }


    //入库
    let res = await DB.insert('book',{
        bookname:data.bookname,
        author:data.author,
        cbs:data.publicname,
        price:data.price,
        cbsdate:data.publicdate,
        catagory:data.catagoryNew,
        switch:data.switchValue,
        desc:data.description,
        photo:filepath

    })

    if(res.result.n>0){
        ctx.body='录入成功';
    }else{
        ctx.body='录入失败';
    }
})


///////////////////////////////////////////////////////
//开启路由
app.use(router.routes()).use(router.allowedMethods());

//开启服务器监听
app.listen(3000, () => {
    console.log('服务器已开启:localhost:3000')
});