var http = require("http");  //http模块不能读取ssl加密的https页面，,需要使用request模块替代
var iconv = require('iconv-lite');  //网页非utf-8时，iconv根据网页chartset转码(解决乱码问题)
var cheerio = require('cheerio');  //使用cheerio，相当于使用jQuery操作页面
var request=require('request');  //针对https页面
var fs = require('fs');  
var path=require('path'); 
var myUtill = require('../models/utill')
// var url = 'https://baike.baidu.com/item/%E6%AF%9B%E6%B3%BD%E4%B8%9C/113835' ;
// var url = 'https://baike.baidu.com/item/%E5%88%98%E5%BE%B7%E5%8D%8E/114923' ;

class GrabWeb{
    constructor(){

    }
    static http(){
        http.get(url, function(res){  
            var arrBuf = []; //存储文本数据 
            //监听data事件，传入的数据
            res.on("data", function(chunk){  
                arrBuf.push(chunk);  //存储响应的文本
            })  
            .on("end", function(){  //end事件，全部接收完就触发
                var chunkAll = Buffer.concat(arrBuf, bufLength); //Buffer的concat方法将一组Buffer对象合并为一个Buffer对象（bufLength可选参数，指定合并后Buffer对象的总长度）。  
                var strJson = iconv.decode(chunkAll,'gb2312');    //iconv根据网页chartset转码(解决乱码问题)
                var $ = cheerio.load(strJson);  //使用cheerio，相当于使用jQuery操作页面(相当于$(html))
                
                // var str = $('body a').text();
                // var date =$('.item').eq(2).children().eq(3).children('a').text()+'\n';
                // var buff1=new Buffer(str+date+"\n"); 
                // //写入文件
                // fs.appendFile(path.join(__dirname,'./txt'),buff1,function(){  
                //     console.log('写入完毕2');  
                // });  
            })
        });  
    }
    //爬取百度百科人物信息{url:''}
    static https(options){
        let _this = this
        let pro = new Promise((resolve,reject)=>{
            request.get({url:options.url,encoding:null},function(err,response,body){
                if(!err&&response.statusCode == 200){
                    // var buf =  iconv.decode(body, 'utf-8');  
                    var $=cheerio.load(body);  
                    var flag1 = $('body .polysemantList-header-title').text().replace(/[\s\r\n]/g,'').indexOf('是一个多义词，请在下列义项上选择浏览（共')
                    var flag2 = $('body .lemmaWgt-subLemmaListTitle').text().replace(/[\s\r\n]/g,'').indexOf('是一个多义词，请在下列义项上选择浏览（共')
                    
                    // "这是一个多义词，请在下列义项上选择浏览（共2个义项）"
                    // 多义词
                    if((flag1>-1 || flag2>-1) && !options.polysemantList){
                        let pro = []
                        let lis = ''
                        if(flag1>-1){
                            lis = $('body .polysemantList-wrapper .item').children('a')  //flag1
                        }else if(flag2>-1){
                            lis = $('body .custom_dot .list-dot .para').children('a')
                        }
                        for(let i=0;i<lis.length;i++){
                            let url = $(lis[i]).attr('href')
                            if(url){
                                url = 'https://baike.baidu.com'+url
                                pro.push(_this.https({url:url,polysemantList:true}))
                            }
                        }
                        // 当前页数据
                        let currentData = getData($)
                        Promise.all(pro).then(data=>{
                            // for(let i=0;i<data.length;i++){
                            //     if(data[i]){
                            //         data[i].url = urlArr[i]
                            //     }
                            // }
                            data.unshift(currentData)
                            data = data.filter(function(val){ return val!==null });
                            resolve(data)
                        })
                    }else{

                            resolve(getData($));
                    }
                    
                } 
            })
        })
        return pro;
        function getData($){
                let name = $('body .lemmaWgt-lemmaTitle-title').children('h1').text()
                let name1 = $('body .lemmaWgt-lemmaTitle-title').children('h2').text()
                let info = $('body .lemma-summary div').eq(0).text();
                if(info){
                    if(info.length<150){
                        info += $('body .lemma-summary div').eq(1).text();
                        info = info.substr(0,180)+".....";
                    }else{
                        info += "....."
                    }
                }
                let imgURL = '';
                if($('body .summary-pic img').attr('src')){
                    imgURL = $('body .summary-pic img').attr('src');
                }else if($('body .album-wrap img').attr('src')){
                    imgURL = $('body .album-wrap img').attr('src');
                }
                let d = null
                if(imgURL && info && name){
                    d = {
                            imgURL:imgURL,
                            info:info,
                            name:name,
                            name1:name1?name1:'', //名字标题
                            tag: '', 
                            birth: '',
                            conste: '', //星座
                    }
                }
                return d
        }
    }
    //爬取百度百科人物信息
    static https1(name,eid){
        let url = 'https://baike.baidu.com/item/'+encodeURI(name);
        let pro = new Promise((resolve,reject)=>{
            request.get({url:url,encoding:null},function(err,response,body){
                if(!err&&response.statusCode == 200){
                    // var buf =  iconv.decode(body, 'utf-8');  
                    var $=cheerio.load(body);  
                    // console.log($('body h1').text());  //名字
                    // console.log($('body .summary-pic img').attr('src')); //图片路径
                    // console.log($('body .lemma-summary div').eq(0).text()); //个人简介

                    // 多义词
                    if($('body .polysemantList-wrapper')){
                        let lis = $('body .polysemantList-wrapper li')
                        
                        return resolve({
                            data:{
                                polysemantList:true,
                                html:$('body .polysemantList-wrapper').html()
                            }
                        });
                    }
                    let info = $('body .lemma-summary div').eq(0).text();
                    if(info){
                        if(info.length<150){
                            info += $('body .lemma-summary div').eq(1).text();
                            info = info.substr(0,150)+".....";
                        }else{
                            info += "....."
                        }
                    }
                    let imgURL = '';
                    if($('body .summary-pic img').attr('src')){
                        imgURL = $('body .summary-pic img').attr('src');
                    }else if($('body .album-wrap img').attr('src')){
                        imgURL = $('body .album-wrap img').attr('src');
                    }
                    // let imgURL = $('body .album-wrap img').attr('src');
                    GrabWeb.saveImage({
                        url:imgURL
                    }).then(url=>{
                        resolve({
                            data:{
                                imgURL:url,
                                info:info,
                                name:name,
                                tag: '',
                                birth: '',
                                conste: '', //星座
                            }
                        });
                    })
                    // console.log(__dirname); //当前文件的目录名
                    // console.log(path.join(__dirname,'../','public')); //当前文件的目录名
                    // GrabWeb.saveImage($('body .summary-pic img').attr('src')); //存入本地

                    // var str = $('body a').text();
                    // var date =$('.item').eq(2).children().eq(3).children('a').text()+'\n';
                    // var buff1=new Buffer(str+date+"\n"); 
                    // //写入文件
                    // fs.appendFile(path.join(__dirname,'./txt'),buff1,function(){  
                    //     console.log('写入完毕2');  
                    // }); 
                }else{
                    reject('爬取数据出错');
                }
            });  
        })
        return pro;
    }
    //保存图片 {url:''}
    static saveImage(options){
        // request(url).pipe(fs.createWriteStream(path.join(__dirname,'../','public','mzd.jpg')));

        // var writeStream=fs.createWriteStream('./mo/'+'error.jpg',{autoClose:true})
        return new Promise((resolve,reject)=>{
            var hash = myUtill.randomString(1);
            var time = Date.now()
            var date = new Date()
            var year = date.getFullYear()
            var month = date.getMonth()+1
            month = month<10 ? '0'+String(month) : String(month)
            // console.log('文件夹名',year + month);
            let dirName = year + month
            fs.exists(path.join(__dirname,'../localImgs/'+dirName),function(exists){
                if(exists){
                    save()
                }
                if(!exists){
                    fs.mkdir( path.join(__dirname,'../localImgs/'+dirName ),function(err){
                        if (!err) {
                            save()
                        }
                    });
                }
            })

            function save(){
                var writeStream=fs.createWriteStream(path.join(__dirname,'../localImgs/'+dirName+'/'+time+hash+'.jpg'),{autoClose:true})
                request(options.url).pipe(writeStream);
                writeStream.on('finish',function(){
                    resolve('/'+dirName+'/'+time+hash+'.jpg')
                })
            }
        })
    }
    //上传文件
    static uploadFile(url){
        fs.createReadStream('file.json').pipe(request.put(url));
        // 将下载到的文件上传
        // request.get('http://google.com/img.png').pipe(request.put('http://mysite.com/img.png'))
    }
    //验证图片长宽
    static checkImg(url){
        let pro = new Promise((resolve,reject)=>{
            // 创建对象
            var img = new Image();
            // 改变图片的src
            img.src = url;
            // 加载完成执行
            img.onload = function(){
                // 打印
                if(img.width>img.height){
                    reject();
                }else{
                    resolve();
                }
            }
        })
        return pro;
    }
}
module.exports = GrabWeb;