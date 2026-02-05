console.clear();
const config = () => require('./settings/config')();
const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    makeInMemoryStore, 
    jidDecode,
    disconnectReason
} = require("@whiskeysockets/baileys");
const pino = require('pino');
const readline = require("readline");
const { Boom } = require('@hapi/boom');

const question = (text) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((resolve) => {
        rl.question(text, (answer) => { resolve(answer); rl.close(); });
    });
}

const startBot = async() => {
    const { state, saveCreds } = await useMultiFileAuthState(`./${config().session}`);
    const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) });

    const client = makeWASocket({
        logger: pino({ level: "silent" }),
        printQRInTerminal: !config().status.terminal,
        auth: state,
        // Browser diperbarui agar tidak stuck saat pairing
        browser: ["Mac OS", "Chrome", "10.15.7"],
        patchMessageBeforeSending: (message) => {
            const requiresPatch = !!(message.buttonsMessage || message.templateMessage || message.listMessage);
            if (requiresPatch) {
                message = {
                    viewOnceMessage: {
                        message: {
                            messageContextInfo: {
                                deviceListMetadata: {},
                                deviceListMetadataVersion: 2
                            },
                            ...message
                        }
                    }
                };
            }
            return message;
        }
    });

    // Fitur Pairing Code
    if (config().status.terminal && !client.authState.creds.registered) {
        const phoneNumber = await question('\x1b[36mMasukkan Nomor WA Bot (Contoh: 62812xxx):\x1b[0m\n');
        const code = await client.requestPairingCode(phoneNumber.trim());
        console.log(`\x1b[32mKode Pairing Kamu:\x1b[0m \x1b[1m${code}\x1b[0m`);
    }

    client.ev.on('creds.update', saveCreds);

    client.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            let shouldReconnect = (lastDisconnect.error instanceof Boom)?.output?.statusCode !== disconnectReason.loggedOut;
            console.log('Koneksi terputus, mencoba menghubungkan kembali...', shouldReconnect);
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('\x1b[32mBot Berhasil Terhubung!\x1b[0m');
        }
    });

    client.ev.on('messages.upsert', async chatUpdate => {
        try {
            const mek = chatUpdate.messages[0];
            if (!mek.message) return;
            // Abaikan pesan dari status/story
            if (mek.key && mek.key.remoteJid === 'status@broadcast') return;

            const { smsg } = require('./image/lib/myfunction');
            const m = await smsg(client, mek, store);
            
            // Panggil messenger hanya jika body tersedia
            if (m.body) {
                require("./messenger")(client, m, chatUpdate);
            }
        } catch (err) { 
            console.log("Error logic:", err); 
        }
    });

    client.decodeJid = (jid) => {
        if (!jid) return jid;
        if (/:\d+@/gi.test(jid)) {
            let decode = jidDecode(jid) || {};
            return decode.user && decode.server && decode.user + '@' + decode.server || jid;
        } else return jid;
    };

    return client;
}
startBot();
