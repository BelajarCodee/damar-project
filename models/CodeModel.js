const {Sequelize} = require('sequelize')
const db = require('../config/database')
const Users = require('./UserModel')

const { DataTypes } = Sequelize

const Codes = db.define('codes', {
    qr:{
        type: DataTypes.STRING,
        allowNull:false,
        validate:{
            notEmpty:true
        }
    },
    email:{
        type: DataTypes.STRING,
    }
}, {
    freezeTableName:true
})
Users.hasOne(Codes, { foreignKey: 'email', sourceKey: 'email' });
module.exports = Codes