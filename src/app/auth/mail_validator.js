import express from "express";
import { createTransport } from 'nodemailer';
import { promises as fsPromises } from 'fs';
import "dotenv/config.js";
import Encryption from '../../core/crypto/encrypt.js';
import db from '../../core/database/config.js';

//? Router
const router = express.Router();

//? middlewares
router.use(express.json());
// url uzerinden gelen api isteklerini ayristirip req.body'ye yerlestirerek kullanilabilir olmasini saglayan middleware
router.use(express.urlencoded({ extended: true }));

//? variables
let mailHtmlContent = await fsPromises.readFile(process.env.EMAIL_TEMPLATE_PATH, 'utf8');

// Todo: (mail_validator get)
router.get('/', (req, res) => {
    res.send("Mail Page");
});

// Todo: (mail_validator post)
router.post(process.env.EMAIL_POST_PATH, async (req, res) => {
    // mobil uygulamadan gelen datalarin decrypt edilip parse edilmesi islemi.
    let verifyCodeData = Encryption.funcDecryptedData(req.body.verifyCode);
    let toMailAddress = Encryption.funcDecryptedData(req.body.toMailAddress);

    // Todo: kullanicinin mail adresi veritabaninda varsa eger mail gonderme, boyle bir kullanici var uyarisi yap.
    countUsersByEmail(toMailAddress)
        .then(userCount => {
            //? mail adresi kayitli mi kontrolu yapilacak.
            userController(userCount, verifyCodeData, toMailAddress, res);
        })
        .catch(err => {
            console.error(err);
        });
});

//? ----- kullanici maili sistemde var mi? -----
function countUsersByEmail(userMail) {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT COUNT(*) AS userCount FROM users WHERE userMail = ?';
        db.execute(sql, [userMail], (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results[0].userCount);
            }
        });
    });
}

function userController(userCount, verifyCodeData, toMailAddress, res) {
    if (userCount === 0) {
        //? ayni mail adresi sistemde henuz bulunmamaktadir, bu mail adresi ile kayit olabilir.
        updateVerifyCode(verifyCodeData);
        sendMailToUser(toMailAddress, res);
    }
    else {
        //! 409 - conflict -> bu kullanici zaten var, cakisma mevcut hata durum kodu!
        res.status(409).send(
            Encryption.funcEncryptedData(process.env.MAIL_VERIFY_CONFLICT_MESSAGE),
        );
    }
}
//? ----- kullanici maili sistemde var mi? -----

//! ---------- mail icerigini guncelleme islemi ----------
function updateVerifyCode(verifyCodeData) {
    // Dosyayı okuyarak mailHtmlContent değişkenine atama işlemini gerçekleştir.
    fsPromises.readFile(process.env.EMAIL_TEMPLATE_PATH, 'utf8')
        .then(content => {
            mailHtmlContent = content;
        })
        .catch(err => {
            console.error('Error -> ', err);
        });
    // replace fonksiyonunun sonucunu mailHtmlContent değişkenine atama islemi.
    mailHtmlContent = mailHtmlContent.replace('{{%content1%}}', verifyCodeData.toString().split('')[0] ?? '');
    mailHtmlContent = mailHtmlContent.replace('{{%content2%}}', verifyCodeData.toString().split('')[1] ?? '');
    mailHtmlContent = mailHtmlContent.replace('{{%content3%}}', verifyCodeData.toString().split('')[2] ?? '');
    mailHtmlContent = mailHtmlContent.replace('{{%content4%}}', verifyCodeData.toString().split('')[3] ?? '');
    mailHtmlContent = mailHtmlContent.replace('{{%content5%}}', verifyCodeData.toString().split('')[4] ?? '');
    mailHtmlContent = mailHtmlContent.replace('{{%content6%}}', verifyCodeData.toString().split('')[5] ?? '');
}
//! ---------- mail icerigini guncelleme islemi ----------

//! ---------- mail gonderme islemi ----------
async function sendMailToUser(toMailAddress, res) {

    var transporter = createTransport({
        service: process.env.MAIL_SERVICE,
        auth: {
            user: process.env.ADMIN_EMAIL_ADDRESS,
            pass: process.env.ADMIN_EMAIL_PASSWORD
        }
    });

    var mailOptions = {
        from: process.env.ADMIN_EMAIL_ADDRESS,
        to: toMailAddress,
        subject: process.env.MAIL_SUBJECT,
        html: mailHtmlContent, // kullanicinin, mailinde html tasarimini gormesi saglanir.
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
            res.sendStatus(555); //! response degerinin mobil uygulamaya donusu -> "posta kutusu mevcut değil" hatasi.
        } else {
            console.log('Email sent: ' + info.response);
            res.status(200).send(Encryption.funcEncryptedData(process.env.MAIL_POST_RESPONSE));
        }
    });
}
//! ---------- mail gonderme islemi ----------
export default router;