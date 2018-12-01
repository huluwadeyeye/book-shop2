
//引入路由模块
const router = require('koa-router')(),
        fs = require('fs');                  //文件处理模块
 const DB = require('../modules/db');
 const sha1 = require('sha1');

//配置路由中间件
router.use(async(ctx,next)=>{

    //判断手否创建了session，如果没有创建，则跳转到登录页面
    if(!ctx.session.username){

        let url = ctx.url;
        if(url =='/admin/login' || url =='/admin/reg' || url =='/admin/regdo' || url =='/admin/logindo'){
          await  next()
        }else{
            //跳转到登录界面
            ctx.redirect('/admin/login');
        }
        
        
    }else{
       await next(); //可以执行路由
    }
    
})




//配置路由
//后台首页
router.get('/',async (ctx)=>{
    ctx.body = '后台首页';
})

//图书列表
router.get('/list',async(ctx)=>{

    let data = await DB.find('book',{});

    //模板渲染
    await ctx.render('list',{list:data});
})

//新书上架
router.get('/add',async(ctx)=>{

    //模板渲染
    await ctx.render('add');
})

router.post('/adddo',async(ctx)=>{
    //接收表单数据
    let data = ctx.request.body;

    const file = ctx.request.files.photo;//file是文件域的name值
    console.log(data)
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
    console.log(data+filepath)

    // 数据入库
  let res =  await DB.insert('book',{
        bookname:data.bookname,
        author:data.author,
        cbs:data.cbs,
        cbsdate:data.cbsdate,
        price:data.price,
        catagory:data.catagory,
        switch:data.switch,
        desc:data.desc,
        photo:filepath
    })
    if(res.result.n>0){
        // console.log('添加成功');
        ctx.redirect('/admin/list')
    }else{
        console.log('添加失败')
    }

})

//用户注册
router.get('/reg',async(ctx)=>{

    //模板渲染
    await ctx.render('reg');
})

router.post('/regdo',async (ctx)=>{
    //接收表单数据
    let data = ctx.request.body;
    

    //接收文件域
    const file = ctx.request.files.photo; //file是文件域的name值
   
        //创建读文件流
        let fileReadStream = fs.createReadStream(file.path);

        //创建上传的文件目录和文件名
        let filepath = 'statics/upload/'+file.name;

        //创建写入流
        let fileWriteStream = fs.createWriteStream(filepath);

        //架设管道流
        fileReadStream.pipe(fileWriteStream);
    
   


    //加密
    let sha1pwd = sha1(data.pwd);


    //入库
  let res = await DB.insert('admin',{username:data.username,pwd:sha1pwd,desc:data.desc,photo:filepath});
    if(res.result.n>0){
        // console.log('入库成功');
        ctx.redirect('admin/login');
    }else{
        console.log('入库失败')
    }
    console.log(data);
})

//用户登录
router.get('/login',async(ctx)=>{

    //模板渲染
    await ctx.render('login');
})


router.post('/logindo',async(ctx)=>{

    //接收表单数据
    let datas = ctx.request.body;


    //加密
    let pwd = sha1(datas.password);
//数据库比对
let res =  await  DB.find('admin',{username:datas.username,pwd:pwd});
   if(res.length>0){
        ctx.session.username=datas.username;
        //   ctx.body='登录成功'
        ctx.redirect('/admin/list');

    }else{
        ctx.body='登录失败'
  
        }
  
    console.log(datas);
})





//浏览
router.get('/view',async(ctx)=>{
    //接收ID
    let data=ctx.query;

//从数据库获取该id信息
  let result = await DB.find('book',{_id:DB.ObjectId(data.id)});
    let jsonData = result[0];

    //给ajax返回数据(模板html)
    await ctx.render('view',jsonData)

    //给Ajax返回数据
    // ctx.body='hi';

})


//修改
router.get('/edit',async(ctx)=>{


    let data = ctx.query;
console.log(data)
    let id = data.id;
    console.log(id)
    //从数据库中获得该id 的全部信息
  let result=  await DB.find('book',{_id:DB.ObjectId(id)});
    let jsonData = result[0];
    console.log(jsonData)


    let newJsonData={
        bookname:jsonData.bookname,
        author:jsonData.author,
        cbs:jsonData.cbs,
        cbsdate:jsonData.cbsdate,
        price:jsonData.price,
        catagory:jsonData.catagory,
        onoff:jsonData.switch,
        desc:jsonData.desc,
        photo:jsonData.photo,
        id:id
    }


    await ctx.render('edit',newJsonData);
})

router.post('/editdo',async(ctx)=>{
    let datas = ctx.request.body;
    let id =datas.id;
    console.log(datas)

    const file = ctx.request.files.photo;//file是文件域的name值
 
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

 var newJsonData={
            bookname:datas.bookname,
            author:datas.author,
            cbs:datas.cbs,
            cbsdate:datas.cbsdate,
            price:datas.price,
            catagory:datas.catagory,
            onoff:datas.switch?datas.switch:0,
            desc:datas.desc,
               
            }
//如果上传了图片就往对象添加一个属性 来记录上传的文件
    if(file.name){
       newJsonData.photo=filepath
    
    }

   
    let res = await DB.edit('book',{_id:DB.ObjectId(id)},{$set:newJsonData});
    if(res.result.n>0){
        console.log('修改成功')

        await ctx.redirect('/admin/list');
    }else{
        console.log('修改失败')
    }

})


//删除
router.get('/del',async(ctx)=>{
//获得ID
    let id = ctx.query.id;

//执行删除
    let res = await DB.delete('book',{_id:DB.ObjectId(id)});
    if(res.result.n>0){
        await ctx.redirect('/admin/list')
    }else{
        console.log('删除失败')
    }
    
})

//购物车
router.get('/cart',async(ctx)=>{
   
   
    await ctx.render('cart');
})


//退出
router.get('/exit',async(ctx)=>{
    //把session的值赋值为空
    ctx.session.username = '';
    //跳转到登录页面
  await  ctx.redirect('/admin/login');
})





//暴露路由模块
module.exports = router.routes();