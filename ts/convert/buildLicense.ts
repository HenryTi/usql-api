import * as crypto from 'crypto';

//const algorithm = 'aes-128-cbc';
//const algorithm = 'aes-48-cbc';
const algorithm = 'RSA-SHA384';
//RSA-SHA384',
//  'RSA-SHA512
const cryptoPassword = 'pickering-on-ca';
const ivText = 'longcheng';
const keyLength = 16;
const ivLength = 16;

const rsaPrivate384 = `
-----BEGIN RSA PRIVATE KEY-----
MIHyAgEAAjEAyqkqDm4/3NJaJhNhPGSVbHMCWY2Tj+XpfhalGxJ+A62TZrK2C/it
aMKyM+CpPu8ZAgMBAAECMCGVHq79ff+tq9qbY4WKdWhfNoh4eXdi9Z6rANHheJuU
+e9tiJQMouzw4bwQTOnXwQIZAO4dtnWWnRJIw/cLbi27bYBO6diSJzQ7bQIZANnh
v6sugF05rv2S6erAVphPOp1zcm7q3QIYHvd4QiSbOsSBz8AJzSLB49zfZo3jUVSl
AhkAl+wqGnF9PgPXuaY0BuUAPImaJGl4VFDdAhgK9nL1vLy3ODZQlM/kpsP0zM6a
HRNp3DQ=
-----END RSA PRIVATE KEY-----
`;

const rsaPrivate512 = `
-----BEGIN RSA PRIVATE KEY-----
MIIBOwIBAAJBAM7nR7MvLBTE2MGG9jH8LjsPFrxVm7pV28T9VDN0y9U5ro6yAtnA
HM71PT465sLAdrY/65gNogrklp8y+wCw03ECAwEAAQJAer766nKx1CBz91v58u2I
/8CT3GdtW75UAynHKj/ALV5ZFaX5+do3+WU0sitjElAu1Gph3q+nWCdeqm8auQNS
AQIhAPms65g0BhsWzXS8QVNrvqSr1accwob7GXnK86XEA3O1AiEA1CT+kgygLxnw
RsYHw2T/SNhQNGii7X/J6KtH8Aw6rk0CIQDFU5lPza4VssvmuvKWT814sCZH0T8d
F09nJrOyC1z/EQIgTVeTbAGoYKOvQs4txGHM5GzgiMrhI38kSGwxlOWQez0CIQDm
Flx6rdCypijjmqF3wetdNWpUdjgp2YkPV0BcdCsNJQ==
-----END RSA PRIVATE KEY-----
`;

const rsaPrivate1024 = `
-----BEGIN RSA PRIVATE KEY-----
MIICXAIBAAKBgQCLVsJ1mM65r0m59T2PHhebZwA8QBziqj5i23pRWy66wlok6H3x
IwBQTp05Ex1bhxgXBG4BVtyBX22dfrOTAoJdZHYGI+j8+MFXajySxaRDsDPMfm+v
i9x6C2e6soQw6fwKZxJ4y+ACcr5USuyYTpZDa1ZxFrgBirhZArSHOPXcXwIDAQAB
AoGANBmvwnrtqV6Sqba6Wt48o33jB6RNaK+RfjNkzDDVCz4KqMxJ8zVMM7sBbMrp
6kRcTJb6bwPElZdSDFbI3IpOpgHNybLHVjkCZ/4L+Yxh7SY1UdL/q6BGNqkhgMQw
DTES0F45k9X6qDC7sdpCWx6NviQQUcBmYZWL3+p03wC5XeECQQDDPJQXbC/5UGsk
iKTQpHToqAG0uabYOLO55MSN7sK+Ntoy7yJtHFwJnU1MgXcxiSjE3vwDEvD/9ofZ
RUpa5LJvAkEAtrSLwKdJwB2+wClAeRLjeSiRUQYfmg6dgmlbewXYTJgdsQKAlywN
10Aca7i+10czxDmSd3aI1pYCMiZAVF+tEQJAN4qARrmMXEy4bkhBOunOKHHDKnq2
METRPE0MbaRC2oIYSO0myguLU2DgoKckFX+DjZ4x6130GZ00wGap5HmzGQJALwFi
Vy1y9v9wHQY/9SZb6cb7JApcRQlvkqbCh3MohAQ611iadso5wWBYL4q3ZrGF6v0Y
5q1TZUnwxLA8qrh20QJBAKFW6zEUcVSB4q7OgtJu9Tw8tposW8KCKQ1M9L2sGHVr
8A3jtkhM6orcANyYwh4U9MQe3rVS8rh8DxXa+B8KR6Q=
-----END RSA PRIVATE KEY-----
`;

export function buildLicense(result:any[]): any[] {
    try {
        if (result.length !== 1) return result;
        let {serialBin, code, userLimit, concurrentLimit, accountLimit, entityLimit, 
            dateStart, monthLimit, dogType, ext } = result[0];
        if (monthLimit === null) monthLimit = -1;

        /*
        let t = Buffer.from('abcdefgh', 'utf8');
        let ret0 = crypto.privateEncrypt(rsaPrivate384, t);
        let rr = ret0.toString('hex');
        */

        let len = 32;// 4096;
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

        let data1 = crypto.privateEncrypt(rsaPrivate384, buf);
        /*
        RSACryptoServiceProvider rsa = new RSACryptoServiceProvider();
        rsa.ImportCspBlob(blobRsa384);
        byte[] data1 = rsa.Encrypt(data, false);
        */

        let data2 = crypto.privateEncrypt(rsaPrivate512, buf);
        /*
        rsa = new RSACryptoServiceProvider();
        rsa.ImportCspBlob(blobRsa512);
        byte[] data2 = rsa.Encrypt(data, false);
        */
        
        let data3 = crypto.privateEncrypt(rsaPrivate1024, buf);
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
        let arr:Buffer[] = [dataLenBuf, buf, data1LenBuf, data1, data2LenBuf, data2, data3LenBuf, data3];
        let size = 0;
        arr.forEach(v => size += v.byteLength);
        let encoded = Buffer.concat([dataLenBuf, buf, data1LenBuf, data1, data2LenBuf, data2, data3LenBuf, data3], 
            size);
        let ret = `License
Dog Serial: ${serialBin}SUPR
CPU Code: ${code}
${encoded.toString('base64')}
==END==`;
        return [ret];
    }
    catch (err) {
        console.error(err);
    }
}
