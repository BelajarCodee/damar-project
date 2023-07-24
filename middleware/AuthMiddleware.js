const Users = require("../models/UserModel");

class AuthMiddleware{
    async IsUser(req,res,next){
        if(!req.session.userId){
            return res.status(401).json({msg: "mohon login ke akun anda"})
        }
        const user = await Users.findOne({
            where:{
                id: req.session.userId
            }
        })
        if(!user){
            return res.status(404).json({msg: "user tidak ditemukan"})
        }
        req.userId = user.id;
        req.role = user.role;
        if(user.role !== "user"){
            return res.status(403).json({msg: "Akses terlarang"})
        }
        next();
    }

    async IsAdmin(req,res,next){
        const user = await Users.findOne({
            where:{
                id: req.session.userId
            }
        })
        if(!user){
            return res.status(404).json({msg: "user tidak ditemukan"})
        }
        if(user.role !== "admin"){
            return res.status(403).json({msg: "Akses terlarang"})
        }
        next();
    }

    async IsScanner(req,res,next){
        const user = await Users.findOne({
            where:{
                id: req.session.userId
            }
        })
        if(!user){
            return res.status(404).json({msg: "user tidak ditemukan"})
        }
        if(user.role !== "scanner"){
            return res.status(403).json({msg: "Akses terlarang"})
        }
        next();
    }

    async IsTamu(req, res, next) {
        if (req.session.userId) {
            // Pengguna telah terotentikasi, beri respon "Akses terlarang"
            return res.status(403).json({ msg: "Akses terlarang" });
        }
        // Pengguna belum masuk (belum terotentikasi), izinkan akses
        next();
    }

    async IsLogin(req, res, next) {
    if (!req.session.userId) {
      // Pengguna belum masuk (belum terotentikasi), beri respon "Akses terlarang"
      return res.status(403).json({ msg: "Akses terlarang" });
    }
    next();
  }
}

module.exports = new AuthMiddleware