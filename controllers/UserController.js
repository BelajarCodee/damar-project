require('dotenv').config();
const Codes = require("../models/CodeModel");
const Users = require("../models/UserModel");
const argon2 = require('argon2');
const dayjs = require('dayjs');
const nodemailer = require('nodemailer');
const qrcode = require('qrcode');
const fs = require('fs');
const env = process.env;
const path = require('path');

class UserController {
  async register(req, res) {
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
        role: "user"
      })

      await Codes.create({
        qr: namaQr,
        email: user.email
      })

       const qrImagePath = path.join(__dirname, `../public/qrcode/${namaQr}.png`);

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
            text: `awikwok awikawok nama : ${user.name} email : ${user.email}`,
            attachments: [
              {
                filename: `${namaQr}.png`,
                path: qrImagePath,
              }
            ]
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

  // async UserUpdate(req, res) {
  //   try {
  //     const userId = req.session.userId;
  //     const user = await Users.findOne({
  //       where: {
  //         id: userId
  //       }
  //     });

  //     if (!user) {
  //       return res.status(404).json({ msg: "User tidak ditemukan" });
  //     }

  //     const { name, email, password, veryPassword } = req.body;
  //     const emailChanged = email && email !== user.email;

  //     if (emailChanged) {
  //       const checkEmail = await Users.findOne({ where: { email } });
  //       if (checkEmail) {
  //         return res.status(409).json({ msg: "Email sudah terdaftar" });
  //       }
  //     }

  //     // Jika password kosong atau sama seperti yang lama, gunakan password yang ada di database
  //     const newPassword = password ? await argon2.hash(password) : user.password;

  //     // Update user data
  //     await Users.update(
  //       {
  //         name,
  //         email: emailChanged ? email : user.email, // Use the new email if changed, otherwise use the old email
  //         password: newPassword,
  //       },
  //       {
  //         where: {
  //           id: userId
  //         }
  //       }
  //     );

  //     if (emailChanged) {
  //       // Buat QR code baru berdasarkan email yang baru
  //       const now = dayjs();
  //       const Y = now.year();
  //       const M = now.month();
  //       const D = now.date();
  //       const H = now.hour();
  //       const I = now.minute();
  //       const S = now.second();
  //       const isiQr = `http://localhost/scanner/${email}`;
  //       const namaQr = `${email}-${Y}-${M}-${D}-${H}-${I}-${S}`;

  //       // Membuat QR code berdasarkan isiQr dan opsi yang diberikan
  //       qrcode.toDataURL(isiQr, { errorCorrectionLevel: 'H' }, async (err, url) => {
  //         if (err) {
  //           console.error('Terjadi kesalahan saat membuat QR code:', err);
  //           return res.status(500).json({ msg: 'Terjadi kesalahan saat membuat QR code' });
  //         }

  //         // Simpan hasil QR code ke dalam file
  //         const qrCodeFilePathNew = path.join('public', 'qrcode', `${namaQr}.png`);
  //         fs.writeFileSync(qrCodeFilePathNew, url.split(',')[1], 'base64');

  //         // Update QR code data in the 'codes' table
  //         const qrData = {
  //           qr: namaQr,
  //           email,
  //         };
  //         await Codes.update(qrData, { where: { email } });

  //         // Hapus QR code lama dari filesystem
  //         const qrCodeFilePathOld = path.join('public', 'qrcode', `${user.qr}.png`);
  //         fs.unlinkSync(qrCodeFilePathOld);

  //         res.status(200).json({ msg: "Data pengguna berhasil diperbarui" });
  //       });
  //     } else {
  //       res.status(200).json({ msg: "Data pengguna berhasil diperbarui" });
  //     }
  //   } catch (error) {
  //     console.error('Terjadi kesalahan:', error);
  //     return res.status(500).json({ msg: 'Terjadi kesalahan saat Update' });
  //   }
  // }
}

module.exports = new UserController();