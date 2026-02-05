module.exports = () => {
    return {
        session: "session_wa",
        botName: "PaKasir-Panel Bot",
        developer: "Dittsans",
        ownerNumber: "6281929461281@s.whatsapp.net",
        pakasir: {
            slug: "nama-toko-kamu", // Ganti dengan slug PaKasir kamu
        },
        panel: {
            domain: "https://panel.kamu.com", // Link panel kamu (tanpa / di akhir)
            apikey: "ptla_xxxxxxx",           // API Key Application (Pterodactyl)
            nestid: "5",
            egg: "15",
            loc: "1"
        },
        status: {
            terminal: true, // true = Pairing Code, false = Scan QR
        }
    }
}
