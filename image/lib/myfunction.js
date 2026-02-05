const { proto, getContentType } = require('@whiskeysockets/baileys')

/**
 * Fungsi smsg untuk memformat pesan Baileys
 */
exports.smsg = (client, m, store) => {
    if (!m) return m
    let M = proto.WebMessageInfo
    if (m.key) {
        m.id = m.key.id
        m.isBaileys = m.id.startsWith('BAE5') && m.id.length === 16
        m.chat = m.key.remoteJid
        m.fromMe = m.key.fromMe
        m.isGroup = m.chat.endsWith('@g.us')
        m.sender = client.decodeJid(m.fromMe ? client.user.id : m.participant || m.key.participant || m.chat || '')
        if (m.isGroup) m.participant = client.decodeJid(m.key.participant) || ''
    }
    if (m.message) {
        m.mtype = getContentType(m.message)
        m.msg = (m.mtype == 'viewOnceMessage' ? m.message[m.mtype].message[getContentType(m.message[m.mtype].message)] : m.message[m.mtype])
        
        // Memastikan m.body aman dari undefined
        m.body = m.message.conversation || m.msg?.caption || m.msg?.text || (m.mtype == 'listResponseMessage') && m.msg?.singleSelectReply?.selectedRowId || (m.mtype == 'buttonsResponseMessage') && m.msg?.selectedButtonId || (m.mtype == 'viewOnceMessage') && m.msg?.caption || m.text || ""
        
        let quoted = m.quoted = m.msg?.contextInfo ? m.msg.contextInfo.quotedMessage : null
        m.mentionedJid = m.msg?.contextInfo ? m.msg.contextInfo.mentionedJid : []
        
        if (m.quoted) {
            let type = getContentType(quoted)
			m.quoted = quoted[type]
            if (['productMessage'].includes(type)) {
				type = getContentType(m.quoted)
				m.quoted = m.quoted[type]
			}
            if (typeof m.quoted === 'string') m.quoted = { text: m.quoted }
            m.quoted.mtype = type
            m.quoted.id = m.msg.contextInfo.stanzaId
			m.quoted.chat = m.msg.contextInfo.remoteJid || m.chat
            m.quoted.isBaileys = m.quoted.id ? m.quoted.id.startsWith('BAE5') && m.quoted.id.length === 16 : false
			m.quoted.sender = client.decodeJid(m.msg.contextInfo.participant)
			m.quoted.fromMe = m.quoted.sender === (client.user && client.user.id)
            m.quoted.text = m.quoted.text || m.quoted.caption || m.quoted.contentText || m.quoted.selectedDisplayText || m.quoted.title || ''
        }
    }
    
    m.text = m.msg?.text || m.msg?.caption || m.message?.conversation || m.msg?.contentText || m.msg?.selectedDisplayText || m.msg?.title || ''
    m.reply = (text, chatId = m.chat, options = {}) => client.sendMessage(chatId, { text: text, ...options }, { quoted: m })
    
    // FIX LINE 96: Tambahkan pengecekan m.body sebelum startsWith
    m.isCmd = m.body ? (m.body.startsWith('!') || m.body.startsWith('.') || m.body.startsWith('/')) : false

    return m
}

exports.runtime = function(seconds) {
	seconds = Number(seconds);
	var d = Math.floor(seconds / (3600 * 24));
	var h = Math.floor(seconds % (3600 * 24) / 3600);
	var m = Math.floor(seconds % 3600 / 60);
	var s = Math.floor(seconds % 60);
	var dDisplay = d > 0 ? d + " hari, " : "";
	var hDisplay = h > 0 ? h + " jam, " : "";
	var mDisplay = m > 0 ? m + " menit, " : "";
	var sDisplay = s > 0 ? s + " detik" : "";
	return dDisplay + hDisplay + mDisplay + sDisplay;
}

exports.sleep = async (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}}

/**
 * Format tanggal Indonesia
 */
exports.tanggal = (num) => {
    let myMonths = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
    let myDays = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
    let date = new Date(num);
    let day = date.getDate();
    let month = date.getMonth();
    let thisDay = date.getDay(),
        thisDay = myDays[thisDay];
    let yy = date.getYear();
    let year = (yy < 1000) ? yy + 1900 : yy;
    return `${thisDay}, ${day} ${myMonths[month]} ${year}`;
}

/**
 * Format waktu (Jam)
 */
exports.getTime = (format, date) => {
    if (date) {
        return new Intl.DateTimeFormat('id-ID', format).format(date);
    } else {
        return new Intl.DateTimeFormat('id-ID', format).format(Date.now());
    }
}

/**
 * Fungsi Delay/Tidur
 */
exports.sleep = async (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}
