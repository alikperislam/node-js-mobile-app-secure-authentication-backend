import express from "express";
import "dotenv/config.js";
import Encryption from '../../core/crypto/encrypt.js';
import Bcrypted from '../../core/crypto/bcrypt.js';
import db from '../../core/database/config.js';
import jwt from "jsonwebtoken"

//? Router
const router = express.Router();

//? middlewares
router.use(express.json());
// url uzerinden gelen api isteklerini ayristirip req.body'ye yerlestirerek kullanilabilir olmasini saglayan middleware
router.use(express.urlencoded({ extended: true }));

// Todo: (signIn get)
router.get('/', (req, res) => {
    res.send("Register Page");
});

// Todo: (signIn post)
router.post(process.env.REGISTER_POST_PATH, async (req, res) => {

    try {
        //Todo: post istegi geldiginde yapilacak islemler.
        let userMail = Encryption.funcDecryptedData(req.body.mailText);
        let userPassword = Encryption.funcDecryptedData(req.body.passwordText);
        let hashedPassword = await Bcrypted.funcBcryptedData(userPassword);
        let userName = Encryption.funcDecryptedData(req.body.nameText);
        let userCountry = Encryption.funcDecryptedData(req.body.countryText);
        let userJob = Encryption.funcDecryptedData(req.body.jobText);
        let userGender = Encryption.funcDecryptedData(req.body.gender) === "true" ? true : false;
        //! token generator
        const userToken = jwt.sign({ email: userMail }, process.env.JWT_SECRET_KEY, { expiresIn: 30 })

        //Todo: MySql sorgulari
        funcUsersTableInsertExecute(userToken, userMail, hashedPassword)
            .then(async insertId => {
                funcProfileTableInsertExecute(insertId, userName, userJob, userCountry, userGender)
                    .then()
                    .catch(err => {
                        console.error(err);
                        res.status(400).send();
                    });
            }).catch(err => {
                console.error(err);
                res.status(400).send();
            });

        //Todo: kullaniciya token don.
        await res.setHeader('authorization', userToken);
        await res.status(200).send(
            {
                "message": Encryption.funcEncryptedData(process.env.SIGN_IN_RETURN_VALUE),
            },
        );
    }
    catch (e) {
        //? islem basarisiz donusu
        res.status(400);
    }
},
);

function funcUsersTableInsertExecute(userToken, userMail, hashedPassword) {
    return new Promise((resolve, reject) => {
        const sql = 'INSERT INTO users SET userToken=?, userMail=?, userPassword=?';
        db.execute(sql, [userToken, userMail, hashedPassword], (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results.insertId);
            }
        });
    });
}

function funcProfileTableInsertExecute(userId, userName, userJob, userCountry, userGender) {
    return new Promise((resolve, reject) => {
        const sql = 'INSERT INTO profile SET userId=?, profileName=?, profileJob=?, profileCountry=?, profileGender=?';
        db.execute(sql, [userId, userName, userJob, userCountry, userGender], (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
}

export default router;