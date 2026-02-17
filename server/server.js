import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: "../.env" });

const app = express();
const port = 3001;

app.use(express.json());

// Endpoint pentru token
app.post("/api/token", async (req, res) => {
  try {
    console.log("📥 Received token request with code:", req.body.code ? "Code present" : "No code");

    const response = await fetch(`https://discord.com/api/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.VITE_DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type: "authorization_code",
        code: req.body.code,
      }),
    });

    console.log("📤 Discord API response status:", response.status);

    const data = await response.json();
    console.log("📦 Discord API response data:", Object.keys(data));

    if (!response.ok) {
      console.error("❌ Discord API error:", data);
      return res.status(response.status).json({
        error: data.error_description || data.error || "Unknown error"
      });
    }

    const { access_token } = data;

    if (!access_token) {
      console.error("❌ No access token in response:", data);
      return res.status(500).json({ error: "No access token received" });
    }

    console.log("✅ Access token received successfully");
    res.json({ access_token });

  } catch (error) {
    console.error("❌ Token endpoint error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint simplu pentru guilds (doar ID-uri)
app.get('/api/guilds', (req, res) => {
  const guildDbPath = process.env.GUILD_DB_PATH

  console.log('Cale guild DB:', guildDbPath);

  fs.readdir(guildDbPath, (err, files) => {
    if (err) {
      console.error('Eroare la citirea directorului:', err);
      return res.status(500).json({ error: 'Nu s-a putut citi lista de servere' });
    }

    console.log('Fișiere găsite:', files);

    const guilds = files
        .filter(file => file.startsWith('guild_') && file.endsWith('.sqlite'))
        .map(file => {
          const match = file.match(/guild_(\d+)\.sqlite/);
          return match ? match[1] : null;
        })
        .filter(id => id !== null);

    console.log('ID-uri guild găsite:', guilds);
    res.json({ guilds });
  });
});

// Endpoint pentru guilds cu detalii
app.get('/api/guilds/details', async (req, res) => {
  try {
    const guildDbPath = process.env.GUILD_DB_PATH

    console.log('Încerc să citesc din:', guildDbPath);

    if (!fs.existsSync(guildDbPath)) {
      console.error('Directorul nu există:', guildDbPath);
      return res.status(500).json({ error: 'Directorul cu baze de date nu există' });
    }

    const files = await fs.promises.readdir(guildDbPath);
    console.log('Fișiere găsite:', files);

    const guildIds = files
        .filter(file => file.startsWith('guild_') && file.endsWith('.sqlite'))
        .map(file => {
          const match = file.match(/guild_(\d+)\.sqlite/);
          return match ? match[1] : null;
        })
        .filter(id => id !== null);

    console.log('ID-uri guild:', guildIds);

    if (guildIds.length === 0) {
      return res.json({ guilds: [] });
    }

    const guildDetails = guildIds.map(guildId => ({
      id: guildId,
      name: `Server ${guildId}`,
      icon: null,
      exists: true
    }));

    res.json({ guilds: guildDetails });
  } catch (error) {
    console.error('Eroare la preluarea listei de guild-uri:', error);
    res.status(500).json({ error: 'Nu s-a putut citi lista de servere' });
  }
});

// NOU: Endpoint pentru datele unui guild specific
app.get('/api/guilds/:guildId/data', async (req, res) => {
  try {
    const { guildId } = req.params;
    const guildDbPath = process.env.GUILD_DB_PATH
    const dbPath = path.join(guildDbPath, `guild_${guildId}.sqlite`);

    console.log('Încerc să citesc baza de date:', dbPath);

    if (!fs.existsSync(dbPath)) {
      return res.status(404).json({ error: 'Baza de date nu există' });
    }

    // Deschide conexiunea la baza de date
    const db = new Database(dbPath, { readonly: true });

    // Obține lista tuturor tabelelor
    const tables = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `).all();

    // Pentru fiecare tabel, obține datele
    const databaseStructure = {};

    tables.forEach(table => {
      const tableName = table.name;

      // Obține informații despre coloane
      const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();

      // Obține primele 100 de rânduri din tabel
      const rows = db.prepare(`SELECT * FROM ${tableName}`).all();

      databaseStructure[tableName] = {
        columns: columns.map(col => ({
          name: col.name,
          type: col.type
        })),
        rows: rows,
        rowCount: db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get().count
      };
    });

    // Închide conexiunea
    db.close();

    res.json({
      guildId,
      database: databaseStructure
    });

  } catch (error) {
    console.error('Eroare la citirea bazei de date:', error);
    res.status(500).json({ error: 'Eroare la citirea bazei de date' });
  }
});

// Endpoint pentru a obține numele serverelor din baza de date
app.get('/api/guilds/with-names', async (req, res) => {
  try {
    const guildDbPath = process.env.GUILD_DB_PATH

    if (!fs.existsSync(guildDbPath)) {
      console.error('Directorul nu există:', guildDbPath);
      return res.status(500).json({ error: 'Directorul cu baze de date nu există' });
    }

    const files = await fs.promises.readdir(guildDbPath);

    const guildIds = files
        .filter(file => file.startsWith('guild_') && file.endsWith('.sqlite'))
        .map(file => {
          const match = file.match(/guild_(\d+)\.sqlite/);
          return match ? match[1] : null;
        })
        .filter(id => id !== null);

    if (guildIds.length === 0) {
      return res.json({ guilds: [] });
    }

    // Pentru fiecare guild, încercăm să citim numele din tabela GuildConfig
    const guildsWithNames = [];

    for (const guildId of guildIds) {
      try {
        const dbPath = path.join(guildDbPath, `guild_${guildId}.sqlite`);

        // Verificăm dacă fișierul există
        if (!fs.existsSync(dbPath)) {
          guildsWithNames.push({
            id: guildId,
            name: `Server ${guildId}`,
            hasName: false
          });
          continue;
        }

        // Deschidem baza de date în modul read-only
        const db = new Database(dbPath, { readonly: true });

        // Verificăm dacă există tabela GuildConfig
        const tableCheck = db.prepare(`
          SELECT name FROM sqlite_master
          WHERE type='table' AND name='GuildConfigs'
        `).get();

        let serverName = `Server ${guildId}`;

        if (tableCheck) {
          // Încercăm să citim numele din GuildConfig
          const config = db.prepare(`SELECT * FROM GuildConfigs LIMIT 1`).get();

          if (config) {
            // Căutăm câmpul care conține numele (poate fi 'guildName', 'name', 'serverName', etc.)
            const possibleNameFields = ['guildName', 'name', 'serverName', 'guild_name', 'server_name'];

            for (const field of possibleNameFields) {
              if (config[field]) {
                serverName = config[field];
                break;
              }
            }

            // Dacă nu găsim niciun câmp specific, încercăm să găsim orice câmp care conține 'name'
            if (serverName === `Server ${guildId}`) {
              for (const key of Object.keys(config)) {
                if (key.toLowerCase().includes('name') && config[key]) {
                  serverName = config[key];
                  break;
                }
              }
            }
          }
        }

        db.close();

        guildsWithNames.push({
          id: guildId,
          name: serverName,
          hasName: serverName !== `Server ${guildId}`
        });

      } catch (error) {
        console.error(`Eroare la citirea numelui pentru guild ${guildId}:`, error);
        guildsWithNames.push({
          id: guildId,
          name: `Server ${guildId}`,
          hasName: false
        });
      }
    }

    res.json({ guilds: guildsWithNames });

  } catch (error) {
    console.error('Eroare la preluarea listei de guild-uri cu nume:', error);
    res.status(500).json({ error: 'Nu s-a putut citi lista de servere' });
  }
});

// Endpoint pentru datele unui guild specific CU FILTRARE DUPĂ PERMISIUNI
app.get('/api/guilds/:guildId/data/:userId', async (req, res) => {
  try {
    const { guildId, userId } = req.params;
    const guildDbPath = process.env.GUILD_DB_PATH
    const dbPath = path.join(guildDbPath, `guild_${guildId}.sqlite`);

    console.log('Încerc să citesc baza de date:', dbPath);
    console.log('Pentru utilizatorul:', userId);

    if (!fs.existsSync(dbPath)) {
      return res.status(404).json({ error: 'Baza de date nu există' });
    }

    // Aici ar trebui să ai o funcție care citește permisiunile din config
    // Pentru acest exemplu, vom face un request la un endpoint de config
    // Sau poți trimite permisiunile direct din frontend

    // Deschide conexiunea la baza de date
    const db = new Database(dbPath, { readonly: true });

    // Obține lista tuturor tabelelor
    const tables = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `).all();

    // Pentru fiecare tabel, obține datele
    const databaseStructure = {};

    tables.forEach(table => {
      const tableName = table.name;

      // Obține informații despre coloane
      const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();

      // Obține TOATE rândurile din tabel
      const rows = db.prepare(`SELECT * FROM ${tableName}`).all();

      databaseStructure[tableName] = {
        columns: columns.map(col => ({
          name: col.name,
          type: col.type
        })),
        rows: rows,
        rowCount: db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get().count
      };
    });

    // Închide conexiunea
    db.close();

    res.json({
      guildId,
      database: databaseStructure,
      userId
    });

  } catch (error) {
    console.error('Eroare la citirea bazei de date:', error);
    res.status(500).json({ error: 'Eroare la citirea bazei de date' });
  }
});

// Endpoint pentru a obține utilizatorii activi dintr-un guild
app.get('/api/guilds/:guildId/active-users', async (req, res) => {
  try {
    const { guildId } = req.params;
    const guildDbPath = process.env.GUILD_DB_PATH
    const dbPath = path.join(guildDbPath, `guild_${guildId}.sqlite`);

    console.log(`📊 Încerc să citesc utilizatorii activi pentru guild: ${guildId}`);

    if (!fs.existsSync(dbPath)) {
      return res.status(404).json({ error: 'Baza de date nu există' });
    }

    // Deschide conexiunea la baza de date
    const db = new Database(dbPath, { readonly: true });

    // Verifică dacă tabela User există
    const userTableExists = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='Users'
    `).get();

    if (!userTableExists) {
      return res.json({ activeUsers: [], totalUsers: 0 });
    }

    // Obține toți utilizatorii
    const users = db.prepare(`SELECT * FROM Users`).all();

    // Identifică utilizatorii activi (presupunând că există un câmp 'isClockedIn' sau similar)
    // Ajustează în funcție de structura reală a bazei tale de date
    const activeUsers = users.filter(user => {
      // Verifică diferite posibilități pentru a determina dacă un utilizator este activ
      return user.isClockedIn === 1 ||
          user.isClockedIn === true ||
          user.status === 'active' ||
          user.clockedIn === 1;
    });

    // Pentru fiecare utilizator activ, încearcă să obții durata sesiunii curente
    const activeUsersWithDetails = activeUsers.map(user => {
      let sessionDuration = null;

      if (user.currentSessionStart) {
        const sessionStart = new Date(user.currentSessionStart);
        const now = new Date();
        const durationMs = now - sessionStart;
        const durationHours = durationMs / (1000 * 60 * 60);
        sessionDuration = durationHours;
      }

      return {
        userId: user.userId || user.id,
        username: user.username || `User ${user.userId}`,
        sessionStart: user.currentSessionStart,
        duration: sessionDuration,
        hourlyRate: user.hourlyRate || 0
      };
    });

    // Obține și câteva statistici de bază
    const totalUsers = users.length;
    const totalActive = activeUsers.length;

    // Închide conexiunea
    db.close();

    res.json({
      guildId,
      totalUsers,
      totalActive,
      activeUsers: activeUsersWithDetails,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Eroare la citirea utilizatorilor activi:', error);
    res.status(500).json({ error: 'Eroare la citirea utilizatorilor activi' });
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});