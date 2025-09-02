const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const sqlite3 = require('sqlite3').verbose();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const PORT = 3000;
const DB_SOURCE = "assinaturas.db";

// Conecta e cria o banco de dados e tabelas
const db = new sqlite3.Database(DB_SOURCE, (err) => {
    if (err) {
      console.error(err.message);
      throw err;
    }
    console.log('Conectado ao banco de dados SQLite.');
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password_hash TEXT,
      public_key TEXT,
      private_key TEXT
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS signatures (
      id TEXT PRIMARY KEY,
      user_id INTEGER,
      original_text TEXT,
      signature_hash TEXT,
      algorithm TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS verification_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      signature_id TEXT,
      was_valid BOOLEAN,
      verifier_ip TEXT,
      verified_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

// Endpoint de Cadastro
app.post("/api/register", (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: "Usuário e senha são obrigatórios." });
    }
    const passwordHash = bcrypt.hashSync(password, 8);
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });
    db.run('INSERT INTO users (username, password_hash, public_key, private_key) VALUES (?,?,?,?)', [username, passwordHash, publicKey, privateKey], function(err) {
        if (err) {
            return res.status(400).json({ error: "Usuário já existe." });
        }
        res.status(201).json({ message: "Usuário criado!", userId: this.lastID });
    });
});

// Endpoint de Assinatura
app.post("/api/sign", (req, res) => {
    const { userId, textToSign } = req.body;
    db.get('SELECT private_key FROM users WHERE id = ?', [userId], (err, user) => {
        if (err || !user) {
            return res.status(404).json({ error: "Usuário não encontrado." });
        }
        const hash = crypto.createHash('sha256').update(textToSign).digest();
        const signer = crypto.createSign('sha256');
        signer.update(hash);
        const signature = signer.sign(user.private_key, 'hex');
        const signatureId = uuidv4();
        db.run('INSERT INTO signatures (id, user_id, original_text, signature_hash, algorithm) VALUES (?,?,?,?,?)', [signatureId, userId, textToSign, signature, 'sha256-rsa'], (err) => {
            if (err) return res.status(500).json({ error: "Erro ao salvar." });
            res.status(201).json({ message: "Texto assinado!", signatureId });
        });
    });
});

// Endpoint de Verificação
app.get("/api/verify/:id", (req, res) => {
    const { id } = req.params;
    const sql = `SELECT s.*, u.username, u.public_key FROM signatures s JOIN users u ON s.user_id = u.id WHERE s.id = ?`;
    db.get(sql, [id], (err, row) => {
        if (err || !row) return res.status(404).json({ error: "Assinatura não encontrada." });
        const hash = crypto.createHash('sha256').update(row.original_text).digest();
        const verifier = crypto.createVerify('sha256');
        verifier.update(hash);
        const isValid = verifier.verify(row.public_key, row.signature_hash, 'hex');
        db.run('INSERT INTO verification_logs (signature_id, was_valid, verifier_ip) VALUES (?,?,?)', [id, isValid, req.ip]);
        if (isValid) {
            res.json({ status: "VÁLIDA", signatory: row.username, algorithm: row.algorithm, signed_at: row.created_at });
        } else {
            res.json({ status: "INVÁLIDA" });
        }
    });
});

// Endpoint para listar assinaturas do usuário
app.post("/api/user/signatures", (req, res) => {
    console.log(`[${new Date().toLocaleTimeString()}] Endpoint /api/user/signatures acessado por: ${req.body.username}`); // Linha de depuração
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: "Usuário e senha são obrigatórios." });
    }

    // 1. Achar o usuário e verificar a senha
    db.get('SELECT id, password_hash FROM users WHERE username = ?', [username], (err, user) => {
        if (err || !user) {
            return res.status(404).json({ error: "Usuário não encontrado." });
        }

        const isPasswordValid = bcrypt.compareSync(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({ error: "Senha incorreta." });
        }

        // 2. Se a senha estiver correta, buscar todas as assinaturas dele
        const sql = "SELECT id, original_text, created_at FROM signatures WHERE user_id = ? ORDER BY created_at DESC";
        db.all(sql, [user.id], (err, rows) => {
            if (err) {
                return res.status(500).json({ error: "Erro ao buscar assinaturas." });
            }
            res.json(rows);
        });
    });
});

app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));
