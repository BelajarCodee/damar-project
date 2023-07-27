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
            html: `
              <html>
                <body style="font-family: Arial, sans-serif;">
                  <h1>Selamat Datang, ${user.name}!</h1>
                  <p>Registrasi Anda berhasil.</p>
                  <p>Ini adalah QR Code Anda:</p>
                  <img src="cid:qrcode" alt="QR Code" />
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

  // async UserUpdate(req, res) {
  //   const userId = req.session.userId;
  //   const { name, email, password, veryPassword } = req.body;

  //   try {
  //     if (!userId) {
  //       return res.status(401).json({ msg: "Mohon login ke akun Anda" });
  //     }

  //     const user = await Users.findOne({
  //       where: {
  //         id: userId
  //       }
  //     });

  //     // Jika pengguna tidak ditemukan, kirimkan respons bahwa pengguna tidak ada
  //     if (!user) {
  //       return res.status(404).json({ msg: "Pengguna tidak ditemukan" });
  //     }

  //     // Cari data QR berdasarkan email pengguna
  //     const code = await Codes.findOne({
  //       where: {
  //         email: user.email
  //       }
  //     });

  //     // Periksa apakah password dan konfirmasi password sesuai
  //     if (password !== veryPassword) {
  //       return res.status(400).json({ msg: "Password tidak sama" });
  //     }

  //     // Inisialisasi variabel untuk menyimpan hash password yang akan disimpan pada database
  //     let hashPassword;

  //     // Jika password tidak diubah atau email tetap sama dengan email yang ada, gunakan password yang ada saat ini
  //     if (!password || password === "" || email === user.email) {
  //       hashPassword = user.password;
  //     } else {
  //       // Jika password diubah, hash password baru
  //       hashPassword = await argon2.hash(password);
  //     }

  //     // Jika email diubah, cari apakah email baru sudah terdaftar pada pengguna lain
  //     if (email && email !== user.email) {
  //       const checkEmail = await Users.findOne({ where: { email: email } });
  //       if (checkEmail) {
  //         return res.status(409).json({ msg: "Email sudah terdaftar" });
  //       }
  //     }

  //     // Simpan perubahan pada pengguna
  //     await Users.update(
  //       {
  //         name: name || user.name,
  //         email: email || user.email,
  //         password: hashPassword
  //       },
  //       {
  //         where: {
  //           id: userId
  //         }
  //       }
  //     );

  //     // Jika email diubah, juga perbarui QR code
  //     if (email && email !== user.email) {
  //       const now = dayjs();
  //       const Y = now.year();
  //       const M = now.month();
  //       const D = now.date();
  //       const H = now.hour();
  //       const I = now.minute();
  //       const S = now.second();
  //       const isiQr = `http://localhost/scanner/${email}`;
  //       const namaQr = `${email}-${Y}-${M}-${D}-${H}-${I}-${S}`;

  //       // Membuat QR code baru berdasarkan email baru
  //       qrcode.toDataURL(isiQr, { errorCorrectionLevel: "H" }, (err, url) => {
  //         if (err) {
  //           console.error("Terjadi kesalahan saat membuat QR code:", err);
  //           return res.status(500).json({ msg: "Terjadi kesalahan saat membuat QR code" });
  //         }

  //         // Simpan hasil QR code ke dalam file
  //         const qrCodeFilePath = `public/qrcode/${namaQr}.png`;
  //         fs.writeFileSync(qrCodeFilePath, url.split(",")[1], "base64");

  //         // Hapus gambar QR lama jika ada
  //         if (code && code.qr) {
  //           const qrImagePathOld = path.join(__dirname, `../public/qrcode/${code.qr}.png`);
  //           fs.unlink(qrImagePathOld, (err) => {
  //             if (err) {
  //               console.error("Terjadi kesalahan saat menghapus gambar:", err);
  //             } else {
  //               console.log("Gambar berhasil dihapus:", qrImagePathOld);
  //             }
  //           });
  //         }

  //         // Perbarui data QR pada tabel Codes
  //         Codes.update(
  //           {
  //             qr: namaQr
  //           },
  //           {
  //             where: {
  //               email: user.email
  //             }
  //           }
  //         );

  //         // Kirim email konfirmasi ke email baru dengan lampiran QR code yang baru
  //         const qrImagePath = path.join(__dirname, `../public/qrcode/${namaQr}.png`);
  //         const transporter = nodemailer.createTransport({
  //           service: "gmail",
  //           auth: {
  //             user: env.MAIL_USERNAME,
  //             pass: env.MAIL_PASSWORD
  //           }
  //         });

  //         const sendEmail = (email) => {
  //           const options = {
  //             from: env.MAIL_USERNAME,
  //             to: email,
  //             subject: "Berhasil registrasi",
  //             text: `Halo, ${name}! Registrasi Anda berhasil.`,
  //             attachments: [
  //               {
  //                 filename: `${namaQr}.png`,
  //                 path: qrImagePath
  //               }
  //             ]
  //           };

  //           transporter.sendMail(options, (err, info) => {
  //             if (err) {
  //               console.log(err);
  //             } else {
  //               console.log(`Email terkirim ke: ${email}`);
  //             }
  //           });
  //         };

  //         sendEmail(email);
  //       });
  //     }

  //     // Kirim respons bahwa update berhasil
  //     return res.status(200).json({ msg: "Update berhasil" });
  //   } catch (error) {
  //     console.error("Terjadi kesalahan:", error);
  //     return res.status(500).json({ msg: "Terjadi kesalahan saat update" });
  //   }
  // }
}

module.exports = new UserController();