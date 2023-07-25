require('dotenv').config();
const Codes = require("../models/CodeModel");
const Users = require("../models/UserModel");
const argon2 = require('argon2');
const dayjs = require('dayjs');
const nodemailer = require('nodemailer');
const qrcode = require('qrcode');
const fs = require('fs');
const env = process.env;

class ScannerController{
    async CheckKehadiran(req,res){
        const userEmail = req.params.email;
        try {
            const user = await Users.findOne({
                attributes:['name', 'email'],
                where: {
                    email: userEmail
                }
            })
            const code = await Codes.findOne({
                attributes:['qr',],
                where:{
                    email:userEmail
                }
            })
            if(!user){
                return res.status(404).json({msg:"User tidak ditemukan"})
            }
            return res.status(200).json({user,code})
        } catch (error) {
            console.error('Terjadi kesalahan:', error);
            return res.status(500).json({ msg: 'Terjadi kesalahan saat Update' });
        }
    }

    async UpdateKehadiran(req,res){
        const userEmail = req.params.email;
        const users = req.body;
        const user = await Users.findOne({
            attributes:['name', 'email'],
            where: {
                email: userEmail
            }
        })
        await Users.update({
            hadir: users.hadir,
            makanSiang: users.makanSiang,
            Snack: users.Snack
        },{
          where:{
            email: userEmail
          }
        });
        res.status(200).json({msg: "User Updated"})
    }
}

module.exports = new ScannerController()