const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');
const { Readable } = require('stream');
const { google }= require('googleapis');

const apikeys = require('./apikeys.json');
const SCOPE = ['https://www.googleapis.com/auth/drive'];


async function authorize(){
    const jwtClient = new google.auth.JWT(
        apikeys.client_email,
        null,
        apikeys.private_key,
        SCOPE
    );

    await jwtClient.authorize();

    return jwtClient;
}

async function uploadFile(authClient, base64Data, fileName, folderId){
    return new Promise((resolve,rejected)=>{
        const drive = google.drive({version:'v3',auth:authClient}); 

        const fileMetaData = {
            name: fileName,
            parents: [folderId]
        };
        const bufferStream = new Readable();
        bufferStream.push(Buffer.from(base64Data, 'base64'));
        bufferStream.push(null);

        drive.files.create({
            resource:fileMetaData,
            media:{
                body: bufferStream, 
                mimeType:'application/octet-stream'
            },
            fields:'id'
        },function(error,file){
            if(error){
                return rejected(error)
            }
            resolve(file);
        })
    });
}

const client = new Client({
  authStrategy: new LocalAuth(),
});

client.on('qr', qr => {
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('Client is ready!');
});

client.on('message', async message => {
  if (message.hasMedia) {
    const media = await message.downloadMedia();
    const base64Data = media.data;
    const fileName = media.filename;
    
    const folderId = '15fhDr2SHWaN0mARKhqzl6KDGKwBn9a1m';
    
    authorize().then(authClient => {
        
        return uploadFile(authClient, base64Data, fileName, folderId);
    })
    .then(uploadedFile => {
        console.log('File uploaded:',media.filename);
        message.reply('file kerind:)');
        //client.sendMessage(message.from, 'Files are found in the below link:');
        client.sendMessage(message.from, 'https://tinyurl.com/ezprintz');
    })
    .catch(error => {
        console.error('Error:', error);
    });
  } else if (message.body === 'ping') {
    message.reply('pong');
  } else if (message.body === 'nadako') {
    message.reply('avo');
  }
});
client.initialize();