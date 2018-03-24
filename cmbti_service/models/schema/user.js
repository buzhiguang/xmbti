//新建一个models目录放数据模型,mongoose的每个数据model需要一个schema生成,
//新建movie.js文件或者其他的数据模型,用来提供基础数据.
// 这里的mongo模型是为应用提供的

const mongoose = require('mongoose')

// 定义一个schema数据库原型( [ˈski:mə] 计划、提要)
const userSchema = mongoose.Schema({
    name: {
        type: String,
        index: true, //提高查询速度
        unique: true //唯一性
    },
    password: String,
    create_time: Date,
    role_name:String
})

// Model模型，是经过Schema构造来的，除了Schema定义的数据库骨架以外，还具有数据库行为模型，他相当于管理数据库属性、行为的类
const User = module.exports = mongoose.model('UserSession', userSchema) 