const {Sequelize} = require('sequelize')
const db = require('../config/database')
const Codes = require('./CodeModel')

const { DataTypes } = Sequelize

const Users = db.define('users', {
    name:{
        type: DataTypes.STRING,
        allowNull:false,
        validate:{
            notEmpty:true
        }
    },
    email:{
        type: DataTypes.STRING,
        allowNull:false,
        validate:{
            notEmpty:true,
            isEmail:true,
        }
    },
    password:{
        type: DataTypes.STRING,
        allowNull:false,
        validate:{
            notEmpty:true
        }
    },
    role:{
        type: DataTypes.STRING,
        allowNull:false,
        validate:{
            notEmpty:true
        }
    },
    hadir:{
        type: DataTypes.STRING,
    },
    makanSiang:{
        type: DataTypes.STRING,
    },
    Snack:{
        type: DataTypes.STRING,
    }
}, {
    freezeTableName:true
})

module.exports = Users;