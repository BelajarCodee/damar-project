const {Sequelize} = require('sequelize')

const db = new Sequelize('belajar','root','',{
    host:'localhost',
    dialect: "mysql"
})

module.exports = db