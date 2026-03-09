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
            name: `Firma ${guildId}`,
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

        let serverName = `Firma ${guildId}`;

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
            if (serverName === `Firma ${guildId}`) {
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

// Endpoint pentru detalii avansate ale guild-ului
app.get('/api/guilds/:guildId/details', async (req, res) => {
  try {
    const { guildId } = req.params;
    const guildDbPath = process.env.GUILD_DB_PATH;
    const dbPath = path.join(guildDbPath, `guild_${guildId}.sqlite`);

    console.log(`📊 Încerc să citesc detalii pentru guild: ${guildId}`);

    if (!fs.existsSync(dbPath)) {
      return res.status(404).json({ error: 'Baza de date nu există' });
    }

    // Deschide conexiunea la baza de date
    const db = new Database(dbPath, { readonly: true });

    // Obține lista tabelelor
    const tables = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `).all();

    let totalRecords = 0;
    let totalColumns = 0;
    const dataTypes = new Set();
    const tablesDetails = [];
    let oldestRecord = null;
    let newestRecord = null;

    // Statistici pentru fiecare tabel
    const tableStats = {};

    for (const table of tables) {
      const tableName = table.name;

      // Informații coloane
      const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
      totalColumns += columns.length;

      // Tipuri de date unice
      columns.forEach(col => {
        if (col.type) dataTypes.add(col.type.toUpperCase());
      });

      // Număr înregistrări
      const count = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get().count;
      totalRecords += count;

      // Dimensiunea estimată a tabelului (număr de pagini * dimensiune pagină)
      const tableInfo = db.prepare(`SELECT * FROM sqlite_master WHERE type='table' AND name=?`).get(tableName);
      const pageCount = db.prepare(`SELECT COUNT(*) as pages FROM ${tableName}`).get().pages || 0;
      const estimatedSize = pageCount * 4096; // 4KB per pagină (dimensiune implicită SQLite)

      // Statistici pentru tabel
      tableStats[tableName] = {
        rowCount: count,
        columnCount: columns.length,
        estimatedSize: estimatedSize,
        sizeFormatted: formatFileSize(estimatedSize)
      };

      // Cea mai veche și cea mai nouă înregistrare (dacă există coloană de tip datetime)
      const dateColumns = columns.filter(col =>
          col.name.toLowerCase().includes('date') ||
          col.name.toLowerCase().includes('at') ||
          col.name.toLowerCase().includes('time') ||
          col.type.toLowerCase().includes('date') ||
          col.type.toLowerCase().includes('time') ||
          col.type.toLowerCase().includes('datetime')
      );

      if (dateColumns.length > 0 && count > 0) {
        const firstDateCol = dateColumns[0].name;

        // Cea mai veche
        const oldest = db.prepare(`SELECT MIN(${firstDateCol}) as oldest FROM ${tableName} WHERE ${firstDateCol} IS NOT NULL`).get();
        if (oldest && oldest.oldest) {
          if (!oldestRecord || oldest.oldest < oldestRecord) {
            oldestRecord = oldest.oldest;
          }
        }

        // Cea mai nouă
        const newest = db.prepare(`SELECT MAX(${firstDateCol}) as newest FROM ${tableName} WHERE ${firstDateCol} IS NOT NULL`).get();
        if (newest && newest.newest) {
          if (!newestRecord || newest.newest > newestRecord) {
            newestRecord = newest.newest;
          }
        }
      }

      // Pregătim detalii pentru fiecare tabel
      tablesDetails.push({
        name: tableName,
        rowCount: count,
        columns: columns.map(col => ({
          name: col.name,
          type: col.type,
          nullable: col.notnull === 0,
          primaryKey: col.pk === 1
        }))
      });
    }

    // Dimensiunea bazei de date
    const stats = fs.statSync(dbPath);
    const dbSizeBytes = stats.size;
    const dbSize = formatFileSize(dbSizeBytes);

    // Data ultimei modificări
    const lastUpdate = stats.mtime.toLocaleDateString('ro-RO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    // Statistici suplimentare
    const avgRecordsPerTable = tables.length > 0 ? Math.round(totalRecords / tables.length) : 0;
    const avgColumnsPerTable = tables.length > 0 ? Math.round(totalColumns / tables.length) : 0;

    // Cea mai populată tabelă
    let mostPopulatedTable = null;
    let maxRows = 0;
    for (const [tableName, stats] of Object.entries(tableStats)) {
      if (stats.rowCount > maxRows) {
        maxRows = stats.rowCount;
        mostPopulatedTable = tableName;
      }
    }

    db.close();

    res.json({
      totalTables: tables.length,
      totalRecords,
      totalColumns,
      uniqueDataTypes: dataTypes.size,
      dbSize,
      dbSizeBytes,
      lastUpdate,
      oldestRecord: oldestRecord ? new Date(oldestRecord).toLocaleDateString('ro-RO') : 'N/A',
      newestRecord: newestRecord ? new Date(newestRecord).toLocaleDateString('ro-RO') : 'N/A',
      avgRecordsPerTable,
      avgColumnsPerTable,
      mostPopulatedTable,
      maxRowsInTable: maxRows,
      tables: tablesDetails,
      tableStats
    });

  } catch (error) {
    console.error('Eroare la citirea detaliilor:', error);
    res.status(500).json({ error: 'Eroare la citirea detaliilor' });
  }
});

// Funcție ajutătoare pentru formatarea dimensiunii fișierului
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Endpoint pentru a obține toți utilizatorii și statisticile lor
app.get('/api/guilds/:guildId/users', async (req, res) => {
  try {
    const { guildId } = req.params;
    const guildDbPath = process.env.GUILD_DB_PATH;
    const dbPath = path.join(guildDbPath, `guild_${guildId}.sqlite`);

    console.log(`📊 Încerc să citesc utilizatorii pentru guild: ${guildId}`);

    if (!fs.existsSync(dbPath)) {
      return res.status(404).json({ error: 'Baza de date nu există' });
    }

    const db = new Database(dbPath, { readonly: true });

    // Verifică dacă tabela User există
    const userTableExists = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='Users'
    `).get();

    if (!userTableExists) {
      return res.json({ users: [], totalUsers: 0 });
    }

    // Obține toți utilizatorii
    const users = db.prepare(`
      SELECT * FROM Users
    `).all();

    // Pentru fiecare utilizator, obținem și datele din CVSubmission dacă există
    const cvTableExists = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='CVSubmission'
    `).get();

    let cvData = {};
    if (cvTableExists) {
      const cvRecords = db.prepare(`SELECT * FROM CVSubmission`).all();
      cvRecords.forEach(record => {
        const userId = record.userId || record.user_id || record.id;
        if (userId) {
          cvData[userId] = {
            fullName: record.fullName || record.firstName + ' ' + record.lastName || record.name,
            cnp: record.cnp
          };
        }
      });
    }

    // Închide conexiunea
    db.close();

    // Procesăm utilizatorii
    const processedUsers = users.map(user => ({
      userId: user.userId || user.id,
      username: user.username || `User ${user.userId}`,
      totalHours: user.totalHours || 0,
      totalEarnings: user.totalEarnings || 0,
      totalSessions: user.totalSessions || 0,
      hourlyRate: user.hourlyRate || 0,
      isClockedIn: user.isClockedIn || false,
      currentSessionStart: user.currentSessionStart,
      cvData: cvData[user.userId] || null
    }));

    // Calculează utilizatorii activi
    const activeUsers = processedUsers.filter(u => u.isClockedIn).map(u => ({
      userId: u.userId,
      username: u.cvData?.fullName || u.username,
      duration: u.currentSessionStart
          ? (Date.now() - new Date(u.currentSessionStart).getTime()) / (1000 * 60 * 60)
          : 0
    }));

    res.json({
      totalUsers: processedUsers.length,
      activeUsers: activeUsers.length,
      users: processedUsers,
      activeUsersList: activeUsers
    });

  } catch (error) {
    console.error('Eroare la citirea utilizatorilor:', error);
    res.status(500).json({ error: 'Eroare la citirea utilizatorilor' });
  }
});

// Endpoint pentru statistici lunare
app.get('/api/guilds/:guildId/monthly-stats', async (req, res) => {
  try {
    const { guildId } = req.params;
    const guildDbPath = process.env.GUILD_DB_PATH;
    const dbPath = path.join(guildDbPath, `guild_${guildId}.sqlite`);

    if (!fs.existsSync(dbPath)) {
      return res.status(404).json({ error: 'Baza de date nu există' });
    }

    const db = new Database(dbPath, { readonly: true });

    // Verifică dacă tabela TimeEntry există
    const timeEntryExists = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='TimeEntry'
    `).get();

    if (!timeEntryExists) {
      return res.json({ monthlyStats: [] });
    }

    const now = new Date();
    const monthlyStats = [];

    // Ultimele 6 luni
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];

      const entries = db.prepare(`
        SELECT * FROM TimeEntry 
        WHERE date BETWEEN ? AND ?
      `).all(startDate, endDate);

      const monthName = date.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' });

      monthlyStats.push({
        name: monthName,
        hours: entries.reduce((sum, e) => sum + (e.duration || 0), 0),
        earnings: entries.reduce((sum, e) => sum + (e.netEarnings || 0), 0),
        sessions: entries.length
      });
    }

    db.close();
    res.json({ monthlyStats });

  } catch (error) {
    console.error('Eroare la citirea statisticilor lunare:', error);
    res.status(500).json({ error: 'Eroare la citirea statisticilor lunare' });
  }
});

// Endpoint pentru configurația guild-ului
app.get('/api/guilds/:guildId/config', async (req, res) => {
  try {
    const { guildId } = req.params;
    const guildDbPath = process.env.GUILD_DB_PATH;
    const dbPath = path.join(guildDbPath, `guild_${guildId}.sqlite`);

    if (!fs.existsSync(dbPath)) {
      return res.status(404).json({ error: 'Baza de date nu există' });
    }

    const db = new Database(dbPath, { readonly: true });

    // Verifică dacă tabela GuildConfig există
    const configExists = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='GuildConfig'
    `).get();

    let config = {
      systemActive: true,
      currency: 'RON',
      clockInChannelId: null
    };

    if (configExists) {
      const guildConfig = db.prepare(`SELECT * FROM GuildConfig LIMIT 1`).get();
      if (guildConfig) {
        config = {
          systemActive: guildConfig.active || true,
          currency: guildConfig.currency || 'RON',
          clockInChannelId: guildConfig.clockInChannelId || null
        };
      }
    }

    db.close();
    res.json(config);

  } catch (error) {
    console.error('Eroare la citirea configurației:', error);
    res.status(500).json({ error: 'Eroare la citirea configurației' });
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});