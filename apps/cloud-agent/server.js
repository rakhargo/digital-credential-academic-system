const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 4000; // Port khusus Agent

// Middleware
app.use(cors()); // Agar bisa diakses dari React (Port 3000/3001)
app.use(bodyParser.json());

// DATABASE SEMENTARA (RAM)
// Di real case, ini database terenkripsi
let inbox = [];

// 1. ENDPOINT PENERIMA (Dipanggil oleh Issuer)
// Sesuai dengan didDocument.serviceEndpoint
app.post('/api/inbox', (req, res) => {
    const credential = req.body;
    console.log("📩 [AGENT] Menerima Ijazah Baru!");
    console.log("   -> Issuer:", credential.issuer);

    // Simpan ke inbox
    inbox.push({
        id: Date.now(),
        receivedAt: new Date().toISOString(),
        content: credential
    });

    res.status(200).json({ message: "Diterima oleh Agent Mahasiswa" });
});

// 2. ENDPOINT PENGAMBILAN (Dipanggil oleh Holder React)
app.get('/api/credentials', (req, res) => {
    res.json(inbox);
});

// 3. ENDPOINT CLEAR (Opsional, untuk demo ulang)
app.delete('/api/inbox', (req, res) => {
    inbox = [];
    res.json({ message: "Inbox dibersihkan" });
});

app.listen(PORT, () => {
    console.log(`🤖 Personal Cloud Agent berjalan di http://localhost:${PORT}`);
    console.log(`   Endpoint aktif: http://localhost:${PORT}/api/inbox`);
});