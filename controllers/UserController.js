require('dotenv').config();
const Codes = require("../models/CodeModel");
const Users = require("../models/UserModel");
const argon2 = require('argon2');
const dayjs = require('dayjs');
const nodemailer = require('nodemailer');
const qrcode = require('qrcode');
const fs = require('fs');
const promises = fs.promises
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

      if(user.password.length < 8){
        return res.status(403).json({ msg: "Password minimal harus 8 karakter" });
      }

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

      const isiQr = `${env.APP_DOMAIN}/scanner/${user.email}`;
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
            html: `
              <html>
                <body style="font-family: Arial, sans-serif;">
                  <h1>Selamat Datang, ${user.name}!</h1>
                  <p>Registrasi Anda berhasil.</p>
                  <p>Ini adalah QR Code Anda:</p>
                  <p>Terima kasih telah bergabung!</p>
                </body>
              </html>
            `,
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

  async getUserForUpdateUser(req,res){
    const userId = req.session.userId;
    try {
      const user = await Users.findOne({
        attributes: ['name', 'email'],
        where:{
          id: userId
        }
      });
      res.status(201).json({ msg: user })
    } catch (error) {
      console.error('Terjadi kesalahan:', error);
      return res.status(500).json({ msg: 'Terjadi kesalahan saat register' });
    }
  }

  async updateUser(req, res) {
    const user = req.body;
    const userId = req.session.userId;
    
    if (!user.name || !user.email || !user.password || !user.veryPassword) {
      return res.status(400).json({ msg: "form tidak boleh kosong" });
    }
    
    if (user.password.length < 8) {
      return res.status(400).json({ msg: "minimal password harus 8 karakter" });
    }
    
    if (user.password !== user.veryPassword) {
      return res.status(400).json({ msg: "Password tidak sama, silahkan masukan kembali" });
    }

    // Hapus gambar QR lama sebelum membuat yang baru
    const currentUser = await Users.findOne({ where: { id: userId } });
    const currentQrImage = currentUser?.code?.qr;

    if (currentQrImage) {
      const qrImagePathToDelete = path.join(__dirname, `../public/qrcode/${currentQrImage}.png`);
      try {
        await promises.unlink(qrImagePathToDelete);
      } catch (err) {
        console.error('Gagal menghapus gambar QR lama:', err);
      }
    }

    const hashPassword = await argon2.hash(user.password);

    const now = dayjs();
    const Y = now.year();
    const M = now.month();
    const D = now.date();
    const H = now.hour();
    const I = now.minute();
    const S = now.second();

    const isiQr = `${env.APP_DOMAIN}/scanner/${user.email}`;
    const namaQr = `${user.email}-${Y}-${M}-${D}-${H}-${I}-${S}`;

    // Membuat QR code berdasarkan isiQr dan opsi yang diberikan
    try {
      const url = await qrcode.toDataURL(isiQr, { errorCorrectionLevel: 'H' });
      const qrCodeFilePath = path.join(__dirname, `../public/qrcode/${namaQr}.png`);
      await promises.writeFile(qrCodeFilePath, url.split(',')[1], 'base64');
    } catch (err) {
      console.error('Terjadi kesalahan saat membuat QR code:', err);
      return res.status(500).json({ msg: 'Terjadi kesalahan saat membuat QR code' });
    }

    await Users.update({
      name: user.name,
      email: user.email,
      password: hashPassword,
    }, {
      where: {
        id: userId
      }
    });

    await Codes.update({
      qr: namaQr,
    }, {
      where: {
        email: user.email
      }
    });

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
        html: `
          <html>
            <body style="font-family: Arial, sans-serif;">
              <h1>Selamat Datang, ${user.name}!</h1>
              <p>update Anda berhasil.</p>
              <p>Ini adalah QR Code Anda:</p>
              <p>Terima kasih telah bergabung!</p>
            </body>
          </html>
        `,
        attachments: [
          {
            filename: `${namaQr}.png`,
            path: qrImagePath,
            cid: 'qrcode' // Memberikan ID agar dapat digunakan pada <img src="cid:qrcode" />
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

    res.status(200).json({ msg: "update berhasil" });
  }
}

module.exports = new UserController();