console.clear();
const config = () => require('./settings/config')();
const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    makeInMemoryStore, 
    jidDecode 
} = require("@whiskeysockets/baileys");
const pino = require('pino');
const readline = require("readline");

const question = (text) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((resolve) => {
        rl.question(text, (answer) => { resolve(answer); rl.close(); });
    });
}

const startBot = async() => {
    const { state, saveCreds } = await useMultiFileAuthState(`./${config().session}`);
    const client = makeWASocket({
        logger: pino({ level: "silent" }),
        printQRInTerminal: !config().status.terminal,
        auth: state,
        browser: ["Ubuntu", "Chrome", "20.0.0"]
    });

    if (config().status.terminal && !client.authState.creds.registered) {
        const phoneNumber = await question('Masukkan Nomor WA Bot (Contoh: 62812xxx):\n');
        const code = await client.requestPairingCode(phoneNumber);
        console.log(`Kode Pairing Kamu: ${code}`);
    }

    client.ev.on('creds.update', saveCreds);
    client.ev.on('messages.upsert', async chatUpdate => {
        try {
            const mek = chatUpdate.messages[0];
            if (!mek.message || mek.key.fromMe) return;
            // Gunakan fungsi smsg dari library myfunction kamu
            const { smsg } = require('./image/lib/myfunction');
            const m = await smsg(client, mek);
            require("./messenger")(client, m, chatUpdate);
        } catch (err) { console.log(err); }
    });

    client.decodeJid = (jid) => {
        if (!jid) return jid;
        if (/:\d+@/gi.test(jid)) {
            let decode = jidDecode(jid) || {};
            return decode.user && decode.server && decode.user + '@' + decode.server || jid;
        } else return jid;
    };

    console.log("Bot Terhubung!");
    return client;
}
startBot();
