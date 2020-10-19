import * as crypto from 'crypto';
import * as constants from 'constants';

//const algorithm = 'aes-128-cbc';
//const algorithm = 'aes-48-cbc';
const algorithm = 'RSA-SHA384';
//RSA-SHA384',
//  'RSA-SHA512
const cryptoPassword = 'pickering-on-ca';
const ivText = 'longcheng';
const keyLength = 16;
const ivLength = 16;

const rsaPublic384 = `
-----BEGIN PUBLIC KEY-----
MEwwDQYJKoZIhvcNAQEBBQADOwAwOAIxAMqpKg5uP9zSWiYTYTxklWxzAlmNk4/l
6X4WpRsSfgOtk2aytgv4rWjCsjPgqT7vGQIDAQAB
-----END PUBLIC KEY-----
`;

const rsaPublic512 = `
-----BEGIN PUBLIC KEY-----
MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAM7nR7MvLBTE2MGG9jH8LjsPFrxVm7pV
28T9VDN0y9U5ro6yAtnAHM71PT465sLAdrY/65gNogrklp8y+wCw03ECAwEAAQ==
-----END PUBLIC KEY-----
`;

const rsaPublic1024 = `
-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCLVsJ1mM65r0m59T2PHhebZwA8
QBziqj5i23pRWy66wlok6H3xIwBQTp05Ex1bhxgXBG4BVtyBX22dfrOTAoJdZHYG
I+j8+MFXajySxaRDsDPMfm+vi9x6C2e6soQw6fwKZxJ4y+ACcr5USuyYTpZDa1Zx
FrgBirhZArSHOPXcXwIDAQAB
-----END PUBLIC KEY-----
`;

function toHex(bytes:Buffer) {
    let str = [];
    for (let i=0; i<bytes.length; i++) {
        str.push('0x' + bytes[i].toString(16));
    }
    let t = str.join(', ');
    return t;
}

function encrypt(data:Buffer, key:string):Buffer {
    let ret = crypto.publicEncrypt({
        key: key,
        //padding: constants.RSA_PKCS1_OAEP_PADDING
        padding: constants.RSA_PKCS1_PADDING, //-- 384， 512 已经通过
        //padding: constants.RSA_PKCS1_PSS_PADDING,
        //padding: constants.RSA_NO_PADDING,
        //padding: constants.RSA_SSLV23_PADDING,
        //padding: constants.RSA_X931_PADDING
        }, data);
    return ret;
}

function encrypt384(data:Buffer):Buffer {
    return encrypt(data, rsaPublic384);
}

function encrypt512(data:Buffer):Buffer {
    return encrypt(data, rsaPublic512);
}

function encrypt1024(data:Buffer):Buffer {
    return encrypt(data, rsaPublic1024);
}

export function buildLicense(result:any[]): any[] {
    try {
        if (result.length !== 1) return result;
        let {serialBin, code, userLimit, concurrentLimit, accountLimit, entityLimit, 
            dateStart, monthLimit, dogType, ext } = result[0];
        if (monthLimit === null) monthLimit = -1;

		// 先写32字节的授权，ext附加在后面
		let len = 32; // 4096;
        if (!serialBin) serialBin = 'FFFFFFFFFFFFFFFF';
        let header:string = serialBin + code;
        let buf = Buffer.alloc(len, header, 'hex');
        let p = header.length / 2;
        //p = buf.write(serialBin, p, len-p, 'hex');
        //bw.Write(serial);
        //if (code.length != 8*2) throw new Error('cpu code must be 8 digits');
        //p = buf.write(code, p, len-p, 'hex');
        //bw.Write(code);
        p = buf.writeInt16LE(userLimit, p);
        //bw.Write(user);
        p = buf.writeInt16LE(concurrentLimit, p);
        //bw.Write(concur);
        p = buf.writeInt16LE(accountLimit, p);
        //bw.Write(account);
        p = buf.writeInt16LE(entityLimit, p);
        //bw.Write(entity);
        let date:Date = new Date(dateStart);
        p = buf.writeInt16LE(date.getFullYear(), p);
        //bw.Write((short)date.Year);
        p = buf.writeInt8(date.getMonth()+1, p);
        //bw.Write((sbyte)date.Month);
        p = buf.writeInt8(date.getDate(), p);
        //bw.Write((sbyte)date.Day);
        p = buf.writeInt16LE(monthLimit, p);
        //bw.Write(monthSum);
        if (dogType == null) dogType = 0;
        p = buf.writeInt16LE(dogType, p);
        //bw.Write(dogType);
        //if (ext === null) ext = ' ';
        //p = buf.write(ext, p, len-p, 'utf8');
        //bw.Write(ext);

        //bw.Flush();
        //byte[] data = ms.ToArray();
        //for (int i = 0; i < data.Length; i++) data[i] ^= 0xA5;

        for (let i=0; i<p; i++) {
            buf.writeUInt8(buf.readUInt8(i) ^ 0xA5, i);
        }

        let data1 = encrypt384(buf);
        let data2 = encrypt512(buf);
        let data3 = encrypt1024(buf);

        /*
        rsa = new RSACryptoServiceProvider();
        rsa.ImportCspBlob(blobRsa512);
        byte[] data2 = rsa.Encrypt(data, false);
        */
        
        /*
        rsa = new RSACryptoServiceProvider();
        rsa.ImportCspBlob(blobRsa1024);
        byte[] data3 = rsa.Encrypt(data, false);
        */

        //ms = new MemoryStream(0x80);
        //bw = new BinaryWriter(ms);
        let dataLenBuf = Buffer.alloc(4);
        dataLenBuf.writeInt32LE(buf.byteLength, 0);
        //bw.Write(data.Length);
        //bw.Write(data);
        let data1LenBuf = Buffer.alloc(4);
        data1LenBuf.writeInt32LE(data1.byteLength, 0);
        //bw.Write(data1.Length);
        //bw.Write(data1);
        let data2LenBuf = Buffer.alloc(4);
        data2LenBuf.writeInt32LE(data2.byteLength, 0);
        //bw.Write(data2.Length);
        //bw.Write(data2);
        let data3LenBuf = Buffer.alloc(4);
        data3LenBuf.writeInt32LE(data3.byteLength, 0);
        //bw.Write(data3.Length);
        //bw.Write(data3);
        //bw.Flush();
        //return ms.ToArray();
        /*
        let t = Buffer.from('abc', 'utf8');
        let ret0 = crypto.publicEncrypt(rsaPrivate384, t);
        let rr = ret0.toString('hex');
        */

        /*
        let iv = Buffer.concat([Buffer.from(ivText)], ivLength);
        var cipher = crypto.createCipheriv(algorithm, rasPrivate384, iv);
        let encrypted = cipher.update(Buffer.from('abc', 'utf8'));
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        let r = encrypted.toString('hex');
        */

        /*
        let ret = 'license 0--0--2 ' + '|' + serialBin + '|' + code + '|' + userLimit 
            + '|' + concurrentLimit + '|' + accountLimit + '|' + entityLimit
            + '|' + dateStart + '|' + monthLimit + '|' + dogType + '|' + ext
        return [ret];
        */
	    
		let extBuf: Buffer;
		if (ext !== null) {
			let extByteLength = Buffer.byteLength(ext, 'utf-8');
			extBuf = Buffer.alloc(extByteLength + 4);
			extBuf.writeInt32LE(extByteLength, 0);
			extBuf.write(ext, 4, 'utf-8');
		}
		else {
			extBuf = Buffer.alloc(0);
		}

        let arr:Buffer[] = [dataLenBuf, buf, data1LenBuf, data1, data2LenBuf, data2, data3LenBuf, data3, extBuf];
        let size = 0;
        arr.forEach(v => size += v.byteLength);
        //let encoded = Buffer.concat([dataLenBuf, buf, data1LenBuf, data1, data2LenBuf, data2, data3LenBuf, data3], 
        //    size);
		let encoded = Buffer.concat(arr, size);
        let ret = `License
Dog Serial: ${serialBin}
CPU Code: ${code}
${encoded.toString('base64')}
==END==
`;
        return [ret];
    }
    catch (err) {
        console.error(err);
    }
}

// rsa nodejs version 跟 C# version 的匹配试验过程
/*
let rr = Buffer.from(rsaPrivate384, 'base64');
let hex = toHex(rr);

let data1 = crypto.privateEncrypt(rsaPrivate384, buf);
let str = toHex(data1);
let p1 = crypto.publicDecrypt(rsaPublic384, data1);
let p2 = crypto.publicDecrypt(rsaPrivate384, data1);

let pubData1 = crypto.publicEncrypt({
    key: rsaPublic384,
    //padding: constants.RSA_PKCS1_OAEP_PADDING
    padding: constants.RSA_PKCS1_PADDING,
    //padding: constants.RSA_PKCS1_PSS_PADDING,
    //padding: constants.RSA_NO_PADDING,
    //padding: constants.RSA_SSLV23_PADDING,
    //padding: constants.RSA_X931_PADDING
},buf);
let str1 = toHex(pubData1);
let p4 = crypto.privateDecrypt({
    key: rsaPrivate384,
    padding: constants.RSA_PKCS1_PADDING,
}, pubData1);
let p3 = crypto.privateDecrypt(rsaPublic384, pubData1);

//let b1 = crypto.privateDecrypt(rsaPrivate384, p1);

//let data1 = crypto.privateEncrypt(rsaPrivate384, buf);
/*
RSACryptoServiceProvider rsa = new RSACryptoServiceProvider();
rsa.ImportCspBlob(blobRsa384);
byte[] data1 = rsa.Encrypt(data, false);
*/
