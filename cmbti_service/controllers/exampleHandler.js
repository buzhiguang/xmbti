
const ExampleModel = require('../models/schema/exampleSchema')
const CommentModel = require('../models/schema/commentSchema')
const moment = require('moment')
const myUtill = require('../models/utill')
const GrabWeb = require('../controllers/grabWeb')
class Example{
    constructor(){

    }
    // 创建名人例 {name:''}
    createExample(options){
        return new Promise((resolve,reject)=>{
            ExampleModel.example.findOne({name:options.name}).then(example=>{
                if(!example){
                    GrabWeb.https(options.name).then(data=>{
                        let vote = {
                                entp:0,
                                intp:0,
                                entj:0,
                                intj:0,
                                enfp:0,
                                infp:0,
                                enfj:0,
                                infj:0,
                                estj:0,
                                istj:0,
                                esfj:0,
                                isfj:0,
                                estp:0,
                                istp:0,
                                esfp:0,
                                isfp:0
                            }
                    
                        let exampleAdd = new ExampleModel.example({
                            name: options.name,
                            type: "****",
                            vote: vote,
                            info: data.data.info || '',
                            img_url: data.data.imgURL || '',
                            total: 0, 
                            tag: data.data.tag || '',
                            birth: data.data.birth || '',
                            conste: data.data.conste || '', //星座
                            create_time: new Date(),
                        })
                        exampleAdd.save((err, example) => {
                            if(err) {
                                reject('Data save fail')
                            } else {
                                new ExampleModel.comment({
                                    eid:example._id,
                                    comment:[],
                                    title:exampleAdd.name
                                }).save((err,comment)=>{
                                    if(err) return reject('save fail')
                                    resolve(example)
                                })
                            }
                        })
                    },data=>{
                        reject("数据抓取失败")
                    })    

                }else{
                    reject('Name already exists!')
                }
            })
        })
    }
    // params : {name:'',type:'',page:'',size:''}
    searchExample(options={}){
        return new Promise((resolve,reject)=>{
            // let page = options.page && /^[1-9][0-9]*$/.test(options.page) ? Number(options.page): 1
            // let size = options.size && /^[1-9][0-9]*$/.test(options.size) ? Number(options.size): 5
            let pro;
            // 1.按name 模糊查询
            if(options.name){
                pro = ExampleModel.example.find({ name:new RegExp(options.name,'i') });
            // 2.按type 模糊查询
            }else if(options.type){
                pro = ExampleModel.example.find({ type:new RegExp(options.type,'i') });
            // 3.查找所有
            }else{
                pro = ExampleModel.example.find();
                // return reject('params error')
            }

            // query.where({age:30});
            // query.sort({ name: 'asc', age: -1 });
            // //query.and({_id:"123456222"});
            // query.or([{_id:"123456fff222"},{_id:"123456222"}]);
            // //query.limit(3); //限制条数
            // //query.skip(3)   //开始数 ，通过计算可是实现分页
            // //query.friends('name')
            // query.exec(function(err,docs){
            //     console.log(docs);
            // })
            // pro.limit(size).skip((page-1)*size).then(example=>{
            pro.then(example=>{
                if(example){
                    resolve(example)
                }else{
                    reject('example not finded')
                }

            })
        })
    }
    // params : {eid:'',uid:'可选'}
    getExampleById(options={}){
        return new Promise((resolve,reject)=>{
            if(!options.eid) return reject('The params error')
            ExampleModel.example.findById(options.eid,(err,example)=>{
                if(!err){
                    if(example){
                        if(options.uid){  //已登录
                            // 判断是否透过票
                             example.voted = false
                             for(let i=0;i<example.vote_log.length;i++){
                                if(example.vote_log[i].uid === options.uid){
                                    example.voted = true
                                    break;
                                }
                            }
                            resolve(example)
                        }else{ //未登录
                            example.voted = false
                            resolve(example)
                        }
                    }
                }else{
                    reject(err)
                }
            })

        })
    }
    // 去重判断
    exampleHandle(options){
        if(options.uid){  //已登录
            for(let i=0;i<example.vote_log.length;i++){
                if(example.vote_log[i].uid === options.uid){
                    example.voted = true
                    return resolve(example)
                }
                example.voted = false
                resolve(example)
            }
        }else{ //未登录
            example.voted = false
            resolve(example)
        }

    }
    // params : {eid:string,uid:string,result:'intj'}
    addVote(options){
        return new Promise((resolve,reject)=>{
            ExampleModel.example.findById(options.eid,(err,example)=>{
                if(!err){
                    if(example){
                        //验证是否重复
                        // for(let i=0;i<example.vote_log.length;i++){
                        //     if(example.vote_log[i].uid === options.uid){
                        //         return reject('Unable to repeat the vote')
                        //     }
                        // }
                        if(example.vote_log.indexOf(options.uid)>-1) return reject('Unable to repeat the vote')
                        // 更新type 、vote 、vote_log
                        if(example.type!=="****"){
                            if(Object.keys(example.vote).indexOf(options.result)!=-1){
                                if(example.type!==options.result && example.vote[options.result]+1 > example.vote[example.type]){
                                    example.type=options.result 
                                } 
                            }else{
                                return reject('The params error')
                            }
                        }else{
                            example.type = options.result
                        }
                        example.vote[options.result] = example.vote[options.result]+1
                        example.vote_log.push(options.uid)
                        // type 、vote 、vote_log 验证 一致性（临时）
                        // let tempObj = {}
                        // example.vote_log.forEach((v,i)=>{
                        //     tempObj[v.result] ? tempObj[v.result]=tempObj[v.result]+1 : tempObj[v.result]=1
                        // })
                        example.save((err,example)=>{
                            if(!err){
                                resolve(example)
                            }else{
                                reject(err)
                            }
                        })
                        

                    }
                }
            })
        })
    }
    // params: {eid:'',uid:'',result:'',cid:'回复别人'}
    addComment(options){
        return new Promise((resolve,reject)=>{
            let cid = myUtill.randomString(7)
            ExampleModel.comment.update({"eid":options.eid},{$addToSet:{comment:{
                    uid:options.uid,
                    cid:cid,
                    content:options.result,
                    c_time:new Date(),
                    zan:[], //[uid,uid]
                    zans:0,
                    replay:options.cid?options.cid:''
            }}},err=>{
                if(err) reject(err)
                resolve(cid)
            })
        })
    }
    // 获取文章的评论params: {eid:''}
    getComment(options={}){
        return new Promise((resolve,reject)=>{
            let page = options.page && /^[1-9][0-9]*$/.test(options.page) ? Number(options.page): 1
            let size = options.size && /^[1-9][0-9]*$/.test(options.size) ? Number(options.size): 5
            ExampleModel.comment.findOne({"eid":options.eid}).then(c=>{
                if(c){
                        resolve(c.comment)
                }else{
                     reject('The eid find is failed')
                }
            })

        })
    }

    // 评论点赞params : {eid:'',cid:''}
    clickCommentZan(options){
        return new Promise((resolve,reject)=>{
            ExampleModel.comment.findOne({"eid":options.eid}).then(e=>{
                if(e){
                    let exist_cid = false
                    for(let i=0;i<e.comment.length;i++){
                        if(e.comment[i].cid === options.cid){
                                exist_cid = true
                                if(e.comment[i].zan.indexOf(options.uid)===-1){
                                    ExampleModel.comment.update({"eid":options.eid,"comment.cid":options.cid},{$push:{"comment.$.zan":options.uid},$inc:{"comment.$.zans":1}},(err,r)=>{
                                        if(err) return reject('Update error!')
                                        return resolve({
                                            info:'Comment赞+1',
                                            count:1
                                        })
                                    })
                                }else{
                                    ExampleModel.comment.update({"eid":options.eid,"comment.cid":options.cid},{$pull:{"comment.$.zan":options.uid},$inc:{"comment.$.zans":-1}},(err,r)=>{
                                        if(err) return reject('Update error!')
                                        return resolve({
                                            count:-1,
                                            info:'Comment取消点赞'
                                        })
                                    })
                                
                                }
                        }
                    }
                    if(!exist_cid){
                        reject('The cid not find!')
                    }
                    // ArticleModel.article.update({"_id":options.aid,"comment._id":options.cid},{$addToSet:{"comment.$.zan":options.uid}},(err,r)=>{
                    //     if(err) return reject('Update error!')
                    //     // { n: 1, nModified: 0, ok: 1 }  未添加
                    //     // { n: 1, nModified: 1, ok: 1 }  已添加
                    //     if(r.nModified===1){
                    //         resolve({
                    //             info:'Comment赞+1',
                    //             count:1
                    //         })
                    //     }else{
                    //         ArticleModel.article.update({"_id":options.aid,"comment._id":options.cid},{$pull:{"comment.$.zan":options.uid}},(err,r)=>{
                    //             if(r.nModified===1){
                    //                 resolve({
                    //                     count:-1,
                    //                     info:'Comment取消点赞'
                    //                 })
                    //             }else{
                    //                 reject('$pull faild')
                    //             }
                    //         })
                    //     }
                    // })
                }else{
                    reject('The find cid result is empty ')
                }
            })
        })
    }
    // cid和eid查看评论options {eid:'必传',cid:[id1,id2,...]}
    getCommentByCid(options={}){
        return new Promise((resolve,reject)=>{
            ExampleModel.comment.findOne({"eid":options.eid}).then(c=>{
                    if(c){
                        let item = {eid:options.eid,  title:c.title||'暂空',  comment:[]}
                        for(let i=0;i<options.cid.length;i++){
                            for(let j=0;j<c.comment.length;j++){
                                if(options.cid[i]===c.comment[j].cid){
                                    c.comment[j].zan=null
                                    item.comment.push(c.comment[j])  
                                }
                            }
                        }
                        resolve(item)
                    }else{
                        resolve(null)
                    }
                }) 
            })
    }
}


module.exports = new Example()