const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 4000;

app.use(cors());
app.use(bodyParser.json());

// DATABASE SEMENTARA
let studentInbox = [];
let pddiktiInbox = []; // <--- DATABASE PELAPORAN KAMPUS

// --- API MAHASISWA ---
app.post('/api/inbox', (req, res) => {
    // ... (Kode lama tetap sama) ...
    const credential = req.body;
    studentInbox.push({ content: credential });
    res.json({ status: "ok" });
});

app.get('/api/credentials', (req, res) => {
    res.json(studentInbox);
});

// --- API BARU: PDDIKTI (PELAPORAN) ---
// 1. Kampus Lapor Data
app.post('/api/pddikti/report', (req, res) => {
    const reportData = req.body; // Isinya: { vcHash, credentialJson, issuer }
    console.log("🏛️ [PDDIKTI] Menerima Laporan Ijazah Baru:", reportData.vcHash);
    
    pddiktiInbox.push({
        ...reportData,
        reportedAt: new Date().toISOString()
    });
    res.json({ status: "reported" });
});

// 2. PDDikti Baca Laporan
app.get('/api/pddikti/reports', (req, res) => {
    res.json(pddiktiInbox);
});

// 3. Hapus Laporan (Setelah divalidasi)
app.post('/api/pddikti/clear', (req, res) => {
    const { hash } = req.body;
    pddiktiInbox = pddiktiInbox.filter(item => item.vcHash !== hash);
    res.json({ status: "cleared" });
});

app.listen(PORT, () => {
    console.log(`🤖 Server Agent + PDDikti Database running on port ${PORT}`);
});