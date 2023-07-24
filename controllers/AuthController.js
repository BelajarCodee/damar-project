const User = require('../models/UserModel')
const argon2 = require('argon2')

class AuthController{
    async login(req,res){
        const user = await User.findOne({
            where:{
                email: req.body.email
            }
        })
        if(!user){
            return res.status(404).json({msg: "user tidak ditemukan"})
        }
        const match = await argon2.verify(user.password, req.body.password)
        if(!match){
            return res.status(400).json({msg: "wrong password"})
        }
        req.session.userId = user.id;
        const name = user.name;
        const email = user.email;
        const role = user.role;
        res.status(200).json({name, email, role});
    }

    async Me(req,res){
        if(!req.session.userId){
            return res.status(401).json({msg: "mohon login ke akun anda"})
        }
        const user = await User.findOne({
            attributes:['name', 'email', 'role'],
            where:{
                id: req.session.userId
            }
        })
        if(!user){
            return res.status(404).json({msg: "user tidak ditemukan"})
        }
        return res.status(200).json({user})
    }

    async logout(req,res){
        req.session.destroy((err)=>{
            if(err){
                return res.status(400).json({msg: "tidak dapat logout"})
            }
            res.status(200).json({msg: "anda telah logout"})
        })
    }
}

module.exports = new AuthController()