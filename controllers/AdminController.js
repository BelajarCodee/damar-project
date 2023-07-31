require('dotenv').config();
const Codes = require("../models/CodeModel");
const Users = require("../models/UserModel");
const argon2 = require('argon2');
const dayjs = require('dayjs');
const nodemailer = require('nodemailer');
const qrcode = require('qrcode');
const fs = require('fs');
const path = require('path');
const env = process.env;
const { Op } = require('sequelize');

class AdminController {
  async getAllUser(req, res) {
    try {
      // Ambil semua data dari tabel Users
      const users = await Users.findAll();

      if (users.length === 0) {
        return res.status(404).json({ msg: "Tidak ada user" });
      }

      // Menghitung jumlah user berdasarkan role
      const roleCounts = {
        user: await Users.count({ where: { role: "user" } }),
        scanner: await Users.count({ where: { role: "scanner" } }),
        admin: await Users.count({ where: { role: "admin" } }),
      };

      // Inisialisasi array untuk menyimpan data user dengan info QR
      const infoUsers = [];

      // Loop melalui setiap user untuk mencari data QR terkait
      for (const user of users) {
        // Cari data QR berdasarkan email user
        const code = await Codes.findOne({ where: { email: user.email } });

        const userInfo = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          qr: code ? code.qr : null, // Jika code tidak ditemukan, qr akan diisi dengan null
          hadir: user.hadir,
          makanSiang: user.makanSiang,
          Snack: user.Snack,
        };

        // Tambahkan userInfo ke dalam array infoUsers
        infoUsers.push(userInfo);
      }

      return res.status(200).json({ msg: infoUsers, roleCounts });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ msg: "Terjadi kesalahan server" });
    }
  }

  async searchUser(req, res) {
    try {
      const { keyword } = req.body;

      // Ambil semua data dari tabel Users berdasarkan kata kunci pencarian (misalnya, nama atau email)
      const users = await Users.findAll({
        where: {
          [Op.or]: [
            { name: { [Op.like]: `%${keyword}%` } },
            { email: { [Op.like]: `%${keyword}%` } }
          ]
        }
      });

      if (users.length === 0) {
        return res.status(404).json({ msg: "User tidak ditemukan" });
      }

      // Menghitung jumlah user berdasarkan role, seperti yang dilakukan di getAllUser
      const roleCounts = {
        user: await Users.count({ where: { role: "user" } }),
        scanner: await Users.count({ where: { role: "scanner" } }),
        admin: await Users.count({ where: { role: "admin" } }),
      };

      // Inisialisasi array untuk menyimpan data user dengan info QR
      const infoUsers = [];

      // Loop melalui setiap user untuk mencari data QR terkait
      for (const user of users) {
        // Cari data QR berdasarkan email user
        const code = await Codes.findOne({ where: { email: user.email } });

        const userInfo = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          qr: code ? code.qr : null, // Jika code tidak ditemukan, qr akan diisi dengan null
          hadir: user.hadir,
          makanSiang: user.makanSiang,
          Snack: user.Snack,
        };

        // Tambahkan userInfo ke dalam array infoUsers
        infoUsers.push(userInfo);
      }

      return res.status(200).json({ msg: infoUsers, roleCounts });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ msg: "Terjadi kesalahan server" });
    }
  }

  async CreateUser(req,res){
    try {
      const user = req.body;

      const role = "user";
      const userCount = await Users.count({ where: { role: role } })
      if (userCount >= 2500) {
        return res.status(403).json({ msg: "Pendaftaran sudah penuh" });
      };

      if (user.password !== user.veryPassword) {
        return res.status(401).json({ msg: "Password tidak sama, silahkan masukan kembali" });
      };

      const checkEmail = await Users.findOne({ where: { email: user.email } })
      if (checkEmail) {
        return res.status(409).json({ msg: "email sudah terdaftar" });
      };

      const hashPassword = await argon2.hash(user.password)

      const now = dayjs();

      const Y = now.year()
      const M = now.month();
      const D = now.date();
      const H = now.hour();
      const I = now.minute();
      const S = now.second();

      const isiQr = `http://localhost/scanner/${user.email}`;
      const namaQr = `${user.email}-${Y}-${M}-${D}-${H}-${I}-${S}`;

      // Membuat QR code berdasarkan isiQr dan opsi yang diberikan
      qrcode.toDataURL(isiQr, { errorCorrectionLevel: 'H' }, (err, url) => {
        if (err) {
          console.error('Terjadi kesalahan saat membuat QR code:', err);
          return res.status(500).json({ msg: 'Terjadi kesalahan saat membuat QR code' });
        }

        // Simpan hasil QR code ke dalam file
        const qrCodeFilePath = `public/qrcode/${namaQr}.png`;
        fs.writeFileSync(qrCodeFilePath, url.split(',')[1], 'base64');
      });

      await Users.create({
        name: user.name || user.username,
        email: user.email,
        password: hashPassword,
        role: user.role
      })

      await Codes.create({
        qr: namaQr,
        email: user.email
      })

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: env.MAIL_USERNAME,
            pass: env.MAIL_PASSWORD,
        }
    });

        const sendEmail = (email) => {
        const options = {
            from: env.MAIL_USERNAME,
            to: email,
            subject: "berhasil registrasi",
            text: `awikwok awikawok nama : ${user.name} email : ${user.email}`
        };

        transporter.sendMail(options, (err, info) => {
            if (err) {
            console.log(err);
            } else {
            console.log(`email terkirim : ${email}`);
            }
        });
        }

        sendEmail(user.email);

      res.status(201).json({ msg: "register berhasil" })
    } catch (error) {
      console.error('Terjadi kesalahan:', error);
      return res.status(500).json({ msg: 'Terjadi kesalahan saat register' });
    }
  }

  async deleteUser(req, res) {
    const userId = req.params.id;
    try {
      // Cari pengguna berdasarkan userId
      const user = await Users.findOne({ where: { id: userId } });

      // Jika pengguna tidak ditemukan, kirimkan respons bahwa pengguna tidak ada
      if (!user) {
        return res.status(404).json({ msg: "Pengguna tidak ditemukan" });
      }

      // Cari data QR berdasarkan email pengguna
      const code = await Codes.findOne({ where: { email: user.email } });

      // Jika data QR ditemukan, hapus gambar QR terkait dari direktori 'public/qrcode'
      if (code && code.qr) {
        const qrImageName = code.qr;
        const qrImagePath = path.join(__dirname, `../public/qrcode/${qrImageName}.png`); // Tambahkan ekstensi .png pada nama file

        // Periksa apakah file gambar QR ada
        fs.access(qrImagePath, (err) => {
          if (err) {
            console.error(err);
          } else {
            // Hapus file gambar QR jika ada
            fs.unlink(qrImagePath, (err) => {
              if (err) {
                console.error(err);
              }
            });
          }
        });
      }

      // Hapus pengguna dari database
      await user.destroy();

      return res.status(200).json({ msg: "Pengguna berhasil dihapus" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ msg: "Terjadi kesalahan server" });
    }
  }

  async deletedAllUser(req, res) {
    try {
      // Menghapus semua pengguna dengan role "user" dari tabel Users
      const deletedUsers = await Users.destroy({
        where: {
          role: "user",
        },
      });

      // Jika tidak ada pengguna dengan role "user" yang dihapus, kirimkan respons bahwa tidak ada pengguna yang dihapus.
      if (deletedUsers === 0) {
        return res.status(404).json({ msg: "Tidak ada pengguna dengan role 'user' yang dihapus" });
      }

      // Hapus semua gambar QR terkait di folder 'public/qrcode'
      const qrImagesPath = path.join(__dirname, '../public/qrcode');

      fs.readdir(qrImagesPath, (err, files) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ msg: "Terjadi kesalahan saat menghapus gambar QR" });
        }

        files.forEach((file) => {
          // Periksa apakah file memiliki ekstensi ".png" dan memuat email pengguna yang dihapus
          if (file.endsWith('.png') && file.includes('@') && file.startsWith('user')) {
            const qrImagePath = path.join(qrImagesPath, file);

            // Hapus file gambar QR
            fs.unlink(qrImagePath, (err) => {
              if (err) {
                console.error(err);
              }
            });
          }
        });
      });

      return res.status(200).json({ msg: "Semua pengguna dengan role 'user' telah dihapus" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ msg: "Terjadi kesalahan server" });
    }
  }
}

module.exports = new AdminController();
