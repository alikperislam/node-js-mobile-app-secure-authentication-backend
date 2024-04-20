import express from "express";
import "dotenv/config.js";
import Encryption from '../../core/crypto/encrypt.js';
import Bcrypted from '../../core/crypto/bcrypt.js';
import db from '../../core/database/config.js';

//? Router
const router = express.Router();

//? middlewares
router.use(express.json());
// url uzerinden gelen api isteklerini ayristirip req.body'ye yerlestirerek kullanilabilir olmasini saglayan middleware
router.use(express.urlencoded({ extended: true }));

// Todo: (logIn get)
router.get('/', (req, res) => {
    res.send("Register Page");
});

// Todo: (logIn post)
router.post(process.env.REGISTER_LOGIN_POST_PATH, async (req, res) => {
    try {
        //Todo: post istegi geldiginde yapilacak islemler.
        let userMail = Encryption.funcDecryptedData(req.body.mailText);
        let userRawPassword = Encryption.funcDecryptedData(req.body.passwordText);
        funcUserController(userMail, userRawPassword, res);
    }
    catch (e) {
        res.status(400).send(); //! servis istegi basarisiz.
    }
},
);

function funcUserController(userMail, userRawPassword, res) {
    isUserRecordInDatabase(userMail)
        .then(async userPassword => {
            if (userPassword === null) {
                res.status(404).send(); //! kullanicinin mail adresi bulunmuyorsa -> kayit bulunamadi donusu.
            }
            else {
                //Todo: mail adresi mevcut fakat sifre de mevcut mu kontrolu?
                let isUser = await Bcrypted.funcComparedData(userRawPassword, userPassword);
                if (isUser === true) {
                    //? mail adresi ve sifre dogru. Kullanici kaydi mevcut. Kullaniciya ilgili token degeri donulecek.
                    funcTokenController(userMail, res);
                }
                else {
                    res.status(401).send(); //! sifre yanlis auth yapilamadi -> login basarisiz donusu.
                }
            }
        })
        .catch(err => {
            console.error(err);
            res.status(400).send();
        });
}

function funcTokenController(userMail, res) {
    getUserTokenWithIdFromDatabase(userMail)
        .then(async usersData => {
            if (usersData === null) {
                res.status(400).send(); //! token bulunamadi.
            }
            else {
                getUserNameFromDatabase(usersData.userId).then(async profileData => {
                    //Todo: kullanici ve token mevcut. Kullaniciya token'i geri dondur. LogIn islemi basarili.
                    await res.setHeader('authorization', usersData.userToken);
                    await res.status(200).send(
                        {
                            "message": Encryption.funcEncryptedData(process.env.LOG_IN_RETURN_VALUE),
                            "name": Encryption.funcEncryptedData(profileData.profileName),
                        },
                    );
                }
                )
                    .catch(err => {
                        console.error(err);
                        res.status(400).send();
                    }
                    );
            }
        }
        )
        .catch(err => {
            console.error(err);
            res.status(400).send();
        }
        );
}

function isUserRecordInDatabase(userMail) {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT userPassword FROM users WHERE userMail = ?';
        db.execute(sql, [userMail], (err, results) => {
            if (err) {
                reject(err);
            } else {
                if (results.length > 0) {
                    const userPassword = results[0].userPassword;
                    resolve(userPassword);
                } else {
                    resolve(null);
                }
            }
        });
    });
}

function getUserTokenWithIdFromDatabase(userMail) {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT userToken, userId FROM users WHERE userMail = ?';
        db.execute(sql, [userMail], (err, results) => {
            if (err) {
                reject(err);
            } else {
                if (results.length > 0) {
                    const recieverData = {
                        'userToken': results[0].userToken,
                        'userId': results[0].userId,
                    }
                    resolve(recieverData);
                } else {
                    resolve(null);
                }
            }
        });
    });
}

function getUserNameFromDatabase(userId) {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT profileName FROM profile WHERE userId = ?';
        db.execute(sql, [userId], (err, results) => {
            if (err) {
                reject(err);
            } else {
                if (results.length > 0) {
                    const recieverData = {
                        'profileName': results[0].profileName,
                    }
                    resolve(recieverData);
                } else {
                    resolve(null);
                }
            }
        });
    });
}
export default router;