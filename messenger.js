const fs = require('fs');
const crypto = require('crypto');
const fetch = require('node-fetch');
const performance = require('performance-now');
const config = require('./settings/config');
const { tanggal, getTime, runtime } = require('./image/lib/myfunction');

let sessionOrder = {};

async function createPanel(usernem, ram_gb, conf) {
    const domain = conf.panel.domain;
    const apikey = conf.panel.apikey;
    let ram, disk, cpu;
    
    if (ram_gb === 'unli') {
        ram = 0; disk = 0; cpu = 0; 
    } else {
        let gb = parseInt(ram_gb);
        ram = gb * 1024;
        disk = gb * 1024;
        cpu = gb * 40; 
    }

    let username = usernem.toLowerCase();
    let email = username + "@gmail.com";
    let password = username + crypto.randomBytes(2).toString('hex');

    try {
        let userF = await fetch(domain + "/api/application/users", {
            method: "POST",
            headers: { "Accept": "application/json", "Content-Type": "application/json", "Authorization": "Bearer " + apikey },
            body: JSON.stringify({ "email": email, "username": username, "first_name": username, "last_name": "Server", "language": "en", "password": password })
        });
        let userData = await userF.json();
        if (userData.errors) return { error: userData.errors[0].detail };

        let serverF = await fetch(domain + "/api/application/servers", {
            method: "POST",
            headers: { "Accept": "application/json", "Content-Type": "application/json", "Authorization": "Bearer " + apikey },
            body: JSON.stringify({
                "name": username.toUpperCase() + " PRIVATE",
                "user": userData.attributes.id,
                "egg": parseInt(conf.panel.egg),
                "docker_image": "ghcr.io/parkervcp/yolks:nodejs_20",
                "startup": "npm start",
                "environment": { "INST": "npm", "USER_UPLOAD": "0", "AUTO_UPDATE": "0", "CMD_RUN": "npm start" },
                "limits": { "memory": ram, "swap": 0, "disk": disk, "io": 500, "cpu": cpu },
                "feature_limits": { "databases": 5, "backups": 5, "allocations": 5 },
                "deploy": { "locations": [parseInt(conf.panel.loc)], "dedicated_ip": false, "port_range": [] }
            })
        });
        let serverData = await serverF.json();
        if (serverData.errors) return { error: serverData.errors[0].detail };

        return { success: true, user: userData.attributes, password, specs: { ram, cpu } };
    } catch (e) { return { error: "Koneksi API Gagal" }; }
}

module.exports = async (client, m, chatUpdate) => {
    try {
        const conf = config();
        const { body, from, sender, pushName, isCmd, command } = m;
        const prefix = isCmd ? body[0] : '!';
        const reply = (teks) => client.sendMessage(from, { text: teks }, { quoted: m });
        const run = runtime(process.uptime());
        const speed = (performance() - performance()).toFixed(4);

        if (!isCmd && sessionOrder[sender]?.step === 'wait_username') {
            sessionOrder[sender].username = body.trim().replace(/\s/g, '').toLowerCase();
            sessionOrder[sender].step = 'pilih_ram';
            const sections = [{
                title: "LIST PAKET PANEL",
                rows: [
                    {title: "RAM 1GB", rowId: `${prefix}1gb`, description: "Rp1.000"},
                    {title: "RAM 2GB", rowId: `${prefix}2gb`, description: "Rp2.000"},
                    {title: "RAM 3GB", rowId: `${prefix}3gb`, description: "Rp3.000"},
                    {title: "RAM 4GB", rowId: `${prefix}4gb`, description: "Rp4.000"},
                    {title: "RAM 5GB", rowId: `${prefix}5gb`, description: "Rp5.000"},
                    {title: "RAM 10GB", rowId: `${prefix}10gb`, description: "Rp10.000"},
                    {title: "RAM UNLIMITED", rowId: `${prefix}unli`, description: "Rp15.000"}
                ]
            }];
            return client.sendMessage(from, { text: `✅ Username diterima: *${sessionOrder[sender].username}*\nSilakan pilih paket RAM:`, buttonText: "KLIK LIST RAM", sections }, { quoted: m });
        }

        const listRam = ["1gb", "2gb", "3gb", "4gb", "5gb", "6gb", "7gb", "8gb", "9gb", "10gb", "unli", "unlimited"];
        if (listRam.includes(command)) {
            if (!sessionOrder[sender]?.username) return reply(`Ketik ${prefix}buy dulu.`);
            let ram_gb = command.replace('unlimited', 'unli');
            let harga = ram_gb === 'unli' ? 15000 : parseInt(ram_gb) * 1000;
            let orderID = "PKSR" + Date.now().toString(36).toUpperCase();
            let link = `https://app.pakasir.com/pay/${conf.pakasir.slug}/${harga}?order_id=${orderID}&qris_only=1`;

            await client.sendMessage(from, {
                image: { url: 'https://b.top4top.io/p_3651j7eif2.jpg' },
                caption: `🛒 *CHECKOUT PANEL*\n\n👤 User: ${sessionOrder[sender].username}\n🖥️ Paket: ${ram_gb.toUpperCase()}\n💰 Total: Rp${harga.toLocaleString()}\n🆔 ID: ${orderID}\n\n*BAYAR DISINI:* \n${link}`,
                buttons: [{ buttonId: 'url', buttonText: { displayText: '💳 Bayar Sekarang' }, type: 1, url: link }]
            }, { quoted: m });

            let count = 0;
            const checkPay = setInterval(async () => {
                count++;
                try {
                    let res = await fetch(`https://app.pakasir.com/api/check-status/${orderID}`);
                    let json = await res.json();
                    if (json.status === 'success' || json.paid === true) {
                        clearInterval(checkPay);
                        reply("✅ *Wait! Pembayaran Sudah Masuk!*\nSedang membuat akun panel...");
                        const resPanel = await createPanel(sessionOrder[sender].username, ram_gb, conf);
                        await client.sendMessage(from, {
                            image: { url: 'https://b.top4top.io/p_3651j7eif2.jpg' },
                            caption: `✅ *SERVER AKTIF*\n👤 User: ${resPanel.user.username}\n🔐 Pass: ${resPanel.password}\n🖥️ RAM: ${ram_gb.toUpperCase()}`,
                            buttons: [
                                { buttonId: 'url', buttonText: { displayText: '🌐 Login' }, type: 1, url: conf.panel.domain },
                                { buttonId: 'c1', buttonText: { displayText: '👤 Salin User' }, type: 1, copyCode: resPanel.user.username },
                                { buttonId: 'c2', buttonText: { displayText: '🔐 Salin Pass' }, type: 1, copyCode: resPanel.password }
                            ]
                        });
                        delete sessionOrder[sender];
                    }
                } catch (e) {}
                if (count > 100) clearInterval(checkPay);
            }, 6000);
            return;
        }

        switch (command) {
            case 'menu':
                client.sendMessage(from, {
                    image: { url: 'https://b.top4top.io/p_3651j7eif2.jpg' },
                    caption: `Hallo *${pushName}*\nSelamat Datang Di AutoOrder\n\n👨‍💻 Dev: ${conf.developer}\n🤖 Bot: ${conf.botName}\n🚀 Speed: ${speed}ms\n⏳ Runtime: ${run}`,
                    buttons: [{ buttonId: `${prefix}buy`, buttonText: { displayText: '🛒 Buy Panel' }, type: 1 }, { buttonId: `${prefix}owner`, buttonText: { displayText: '👨‍💻 Owner' }, type: 1 }]
                });
                break;
            case 'buy':
                sessionOrder[sender] = { step: 'wait_username' };
                reply("Silakan masukkan *Username* panel:");
                break;
            case 'owner':
                const vcard = 'BEGIN:VCARD\nVERSION:3.0\nFN:Owner\nTEL;type=CELL;type=VOICE;waid=6281929461281:+6281929461281\nEND:VCARD';
                client.sendMessage(from, { contacts: { displayName: 'Owner', contacts: [{ vcard }] } });
                break;
        }
    } catch (e) { console.log(e); }
};
