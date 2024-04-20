import CryptoJS from 'crypto-js';

var EncryptionClass = class Encryption {
    static funcDecryptedData = (data) => {
        // Todo: AES Decrypted
        var bytes = CryptoJS.AES.decrypt(data, process.env.ENCRYPT_KEY);
        var descryptedData = bytes.toString(CryptoJS.enc.Utf8);
        return descryptedData;
    }
    static funcEncryptedData = (data) => {
        //Todo: AES Encrypted
        var encryptedData = CryptoJS.AES.encrypt(data, process.env.ENCRYPT_KEY).toString();
        return encryptedData;
    }
}

export default EncryptionClass;