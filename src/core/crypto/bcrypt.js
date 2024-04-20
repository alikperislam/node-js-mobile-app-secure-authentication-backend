import bcrypt from 'bcrypt';

var BcryptClass = class Bcrypt {
    //Todo: sifreyi hashleme islemi
    static funcBcryptedData = (data) => {
        return new Promise((resolve, reject) => {
            const saltRounds = 10;
            bcrypt.hash(data, saltRounds).then(hashed => {
                resolve(hashed); // Hashlenmiş şifreyi dışarıya döndür
            }).catch(error => {
                reject(error);
            });
        });
    }

    static funcComparedData = (data, hashedData) => {
        //Todo: hashlenmis sifre ile gercek sifrenin kontrolu
        return bcrypt.compare(data, hashedData);
    }
}

export default BcryptClass;
