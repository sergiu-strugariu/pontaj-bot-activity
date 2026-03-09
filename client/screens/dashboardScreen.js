import './dashboardScreen.css';
import rocketLogo from '/logo.png';
import { authorizedUsers } from '../configs/config.js';

let currentGuildData = null;
let selectedGuildId = null;
let selectedGuildName = null;
let expandedTables = new Set();
let currentUserPermissions = null;
let currentUserServers = null;
let currentUser = null;
let discordUsername = null;
let userDataGlobal = null;

// ===== CONFIGURARE NUME TABELE =====
const TABLE_DISPLAY_NAMES = {
    'CVSubmission': '📄 CV-uri Depuse',
    'cv_submission': '📄 CV-uri Depuse',
    'CVSubmissions': '📄 CV-uri Depuse',
    'cv_submissions': '📄 CV-uri Depuse',

    'Demisie': '📝 Demisii',
    'demisie': '📝 Demisii',
    'Demisii': '📝 Demisii',
    'demisii': '📝 Demisii',

    'GuildConfig': '⚙️ Configurație Firmă',
    'guild_config': '⚙️ Configurație Firmă',
    'GuildConfigs': '⚙️ Configurație Firmă',
    'guild_configs': '⚙️ Configurație Firmă',

    'Permission': '🔐 Permisiuni',
    'permission': '🔐 Permisiuni',
    'Permissions': '🔐 Permisiuni',
    'permissions': '🔐 Permisiuni',

    'Points': '⭐ Puncte',
    'points': '⭐ Puncte',

    'PointsHistory': '📊 Istoric Puncte',
    'points_history': '📊 Istoric Puncte',
    'PointsHistorys': '📊 Istoric Puncte',

    'Presence': '🟢 Prezență',
    'presence': '🟢 Prezență',

    'SalaryAdjustment': '💰 Ajustări Salarii',
    'salary_adjustment': '💰 Ajustări Salarii',
    'SalaryAdjustments': '💰 Ajustări Salarii',

    'SalaryConfig': '💵 Configurație Salarii',
    'salary_config': '💵 Configurație Salarii',
    'SalaryConfigs': '💵 Configurație Salarii',

    'TimeEntry': '⏱️ Pontaj',
    'time_entry': '⏱️ Pontaj',
    'TimeEntries': '⏱️ Pontaj',
    'time_entries': '⏱️ Pontaj',

    'User': '👥 Utilizatori',
    'user': '👥 Utilizatori',
    'Users': '👥 Utilizatori',
    'users': '👥 Utilizatori',
};

// ===== CONFIGURARE COLOANE PENTRU FIECARE TABEL =====
const TABLE_COLUMN_CONFIG = {
    'CVSubmission': {
        enabled: true,
        columns: [
            { field: 'fullName', header: 'Nume', enabled: true },
            { field: 'cnp', header: 'CNP', enabled: true },
            { field: 'phone', header: 'Telefon', enabled: true },
            { field: 'functie', header: 'Funcție', enabled: true },
            { field: 'luni', header: 'Luni', enabled: true },
            { field: 'status', header: 'Status', enabled: true },
            { field: 'updatedAt', header: 'Ultima Actualizare', enabled: true }
        ]
    },
    'Demisie': {
        enabled: true,
        columns: [
            { field: 'fullName', header: 'Nume', enabled: true },
            { field: 'cnp', header: 'CNP', enabled: true },
            { field: 'reason', header: 'Motiv', enabled: true },
            { field: 'status', header: 'Status', enabled: true },
            { field: 'createdAt', header: 'Ultima Actualizare', enabled: true }
        ]
    },
    'GuildConfig': {
        enabled: true,
        columns: [
            { field: 'guildId', header: 'ID Firmă', enabled: true },
            { field: 'guildName', header: 'Nume Firmă', enabled: true },
            { field: 'prefix', header: 'Prefix', enabled: true },
            { field: 'language', header: 'Limbă', enabled: true },
            { field: 'timezone', header: 'Fus Orar', enabled: true },
            { field: 'currency', header: 'Monedă', enabled: true },
            { field: 'createdAt', header: 'Creat La', enabled: true },
            { field: 'updatedAt', header: 'Actualizat La', enabled: true }
        ]
    },
    'Permission': {
        enabled: true,
        columns: [
            { field: 'userId', header: 'ID Utilizator', enabled: true },
            { field: 'targetName', header: 'Rol', enabled: true },
            { field: 'permissions', header: 'Permisiuni', enabled: true },
            { field: 'createdBy', header: 'Acordat De', enabled: true },
        ]
    },
    'Points': {
        enabled: true,
        columns: [
            { field: 'userId', header: 'ID Utilizator', enabled: true },
            { field: 'points', header: 'Puncte', enabled: true },
            { field: 'reason', header: 'Motiv', enabled: true },
            { field: 'givenBy', header: 'Acordat De', enabled: true },
            { field: 'givenAt', header: 'Acordat La', enabled: true }
        ]
    },
    'PointsHistory': {
        enabled: true,
        columns: [
            { field: 'userId', header: 'ID Utilizator', enabled: true },
            { field: 'points', header: 'Puncte', enabled: true },
            { field: 'action', header: 'Acțiune', enabled: true },
            { field: 'reason', header: 'Motiv', enabled: true },
            { field: 'performedBy', header: 'Efectuat De', enabled: true },
            { field: 'performedAt', header: 'Efectuat La', enabled: true }
        ]
    },
    'Presence': {
        enabled: true,
        columns: [
            { field: 'userId', header: 'ID Utilizator', enabled: true },
            { field: 'status', header: 'Status', enabled: true },
            { field: 'clockIn', header: 'Pornire Pontaj', enabled: true },
            { field: 'clockOut', header: 'Oprire Pontaj', enabled: true },
            { field: 'duration', header: 'Durată', enabled: true },
            { field: 'date', header: 'Data', enabled: true }
        ]
    },
    'SalaryAdjustment': {
        enabled: true,
        columns: [
            { field: 'userId', header: 'ID Utilizator', enabled: true },
            { field: 'oldRate', header: 'Salar vechi', enabled: true },
            { field: 'newRate', header: 'Salar nou', enabled: true },
            { field: 'percentage', header: 'Procent', enabled: true },
            { field: 'reason', header: 'Motiv', enabled: true },
            { field: 'updatedAt', header: 'Actualizat La', enabled: true }
        ]
    },
    'SalaryConfig': {
        enabled: true,
        columns: [
            { field: 'roleName', header: 'Funcție', enabled: true },
            { field: 'salaryType', header: 'Salariu Bază', enabled: true },
            { field: 'baseRate', header: 'Rată Orară', enabled: true },
            { field: 'priority', header: 'Prioritate', enabled: true },
            { field: 'updatedAt', header: 'Actualizat La', enabled: true }
        ]
    },
    'TimeEntry': {
        enabled: true,
        columns: [
            { field: 'userId', header: 'ID Utilizator', enabled: true },
            { field: 'employeeInfo', header: 'Angajat', enabled: true },
            { field: 'clockIn', header: 'Pornire Pontaj', enabled: true },
            { field: 'clockOut', header: 'Oprire Pontaj', enabled: true },
            { field: 'duration', header: 'Durată', enabled: true }
        ]
    },
    'User': {
        enabled: true,
        columns: [
            { field: 'userId', header: 'ID Utilizator', enabled: true },
            { field: 'username', header: 'Nume Utilizator', enabled: true },
            { field: 'email', header: 'Email', enabled: true },
            { field: 'role', header: 'Rol', enabled: true },
            { field: 'department', header: 'Departament', enabled: true },
            { field: 'position', header: 'Funcție', enabled: true },
            { field: 'hireDate', header: 'Data Angajării', enabled: true },
            { field: 'status', header: 'Status', enabled: true },
            { field: 'lastLogin', header: 'Ultima Autentificare', enabled: true },
            { field: 'createdAt', header: 'Creat La', enabled: true }
        ]
    }
};

// Funcție pentru a obține configurația coloanelor pentru un tabel
function getTableColumnConfig(tableName) {
    for (const [key, config] of Object.entries(TABLE_COLUMN_CONFIG)) {
        if (tableNameMapping[key]?.includes(tableName)) {
            return config;
        }
    }
    return null;
}

// Funcție pentru a filtra coloanele în funcție de configurație
function filterColumnsByConfig(columns, tableName) {
    const config = getTableColumnConfig(tableName);
    if (!config || !config.enabled) return columns;

    const enabledFields = config.columns
        .filter(col => col.enabled)
        .map(col => col.field);

    return columns.filter(col => enabledFields.includes(col.name));
}

// Funcție pentru a obține header-ul personalizat pentru o coloană
function getColumnHeader(columnName, tableName) {
    const config = getTableColumnConfig(tableName);
    if (!config) return columnName;

    const columnConfig = config.columns.find(col => col.field === columnName);
    return columnConfig ? columnConfig.header : columnName;
}

const tableNameMapping = {
    'CVSubmission': ['CVSubmission', 'cv_submission', 'CVSubmissions', 'cv_submissions'],
    'Demisie': ['Demisie', 'demisie', 'Demisii', 'demisii'],
    'GuildConfig': ['GuildConfig', 'guild_config', 'GuildConfigs', 'guild_configs'],
    'Permission': ['Permission', 'permission', 'Permissions', 'permissions'],
    'Points': ['Points', 'points'],
    'PointsHistory': ['PointsHistory', 'points_history', 'PointsHistorys'],
    'Presence': ['Presence', 'presence'],
    'SalaryAdjustment': ['SalaryAdjustment', 'salary_adjustment', 'SalaryAdjustments'],
    'SalaryConfig': ['SalaryConfig', 'salary_config', 'SalaryConfigs'],
    'TimeEntry': ['TimeEntry', 'time_entry', 'TimeEntries', 'time_entries'],
    'User': ['User', 'user', 'Users', 'users']
};

// Funcție pentru a obține numele afișat al unui tabel
function getTableDisplayName(tableName) {
    return TABLE_DISPLAY_NAMES[tableName] || tableName;
}

// Funcție pentru a obține iconița în funcție de tipul tabelului
function getTableIcon(tableName) {
    const displayName = getTableDisplayName(tableName);
    const icons = ['📄', '📝', '⚙️', '🔐', '⭐', '📊', '🟢', '💰', '💵', '⏱️', '👥'];

    for (const icon of icons) {
        if (displayName.startsWith(icon)) {
            return icon;
        }
    }
    return '📋';
}

// Funcție pentru a obține numele fără iconiță
function getTableCleanName(tableName) {
    const displayName = getTableDisplayName(tableName);
    return displayName.replace(/^[📄📝⚙️🔐⭐📊🟢💰💵⏱️👥]\s/, '');
}

// Funcție pentru a verifica dacă un câmp este de tip datetime
function isDateTimeField(fieldName) {
    const dateTimeFields = [
        'updatedAt', 'createdAt', 'givenAt', 'performedAt', 'lastLogin',
        'clockIn', 'clockOut', 'hireDate', 'submittedAt', 'grantedAt',
        'expiresAt', 'effectiveDate', 'date'
    ];
    return dateTimeFields.includes(fieldName);
}

// Funcție pentru a formata data cu oră și secunde
function formatDateTime(value) {
    if (!value) return value;

    try {
        const date = new Date(value);
        if (isNaN(date.getTime())) return value;

        return date.toLocaleDateString('ro-RO', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    } catch (e) {
        return value;
    }
}

export function showDashboardScreen(userData, currentUserParam, discordUsernameParam) {
    const app = document.querySelector('#app');

    currentUser = currentUserParam;
    discordUsername = discordUsernameParam;
    userDataGlobal = userData;
    currentUserPermissions = userData.permissions || {};
    currentUserServers = userData.servers || {};

    const now = new Date();
    const formattedDate = now.toLocaleDateString('ro-RO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const formattedTime = now.toLocaleTimeString('ro-RO', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    app.innerHTML = `
        <div class="dashboard-wrapper">
            <div class="dashboard-frame">
                <!-- Header -->
                <div class="dashboard-header">
                    <div class="header-left">
                        <img src="${rocketLogo}" class="institution-logo" alt="Logo" />
                        <div class="institution-info">
                            <h1>Inspecța Muncii</h1>
                            <h2>Inspectoratul Teritorial de Muncă</h2>
                        </div>
                    </div>
                    <div class="header-right">
                        <div class="security-tag">
                            <span class="security-dot"></span>
                            Sistem securizat • Nivel clasificat
                        </div>
                        <div class="user-info">
                            <div class="user-avatar">${discordUsername.charAt(0).toUpperCase()}</div>
                            <div class="user-details">
                                <span class="user-name">${discordUsername}</span>
                                <span class="user-role">${userData.role}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Layout principal -->
                <div class="dashboard-layout">
                    <!-- Sidebar -->
                    <div class="dashboard-sidebar">
                        <div class="sidebar-header">
                            <h3>Firme disponibile</h3>
                            <div class="server-count" id="server-count">
                                Se încarcă...
                            </div>
                        </div>
                        <div class="guild-list" id="guild-list">
                            <div class="loading-state" style="min-height: 200px;">
                                <div class="loading-spinner"></div>
                                <p>Se încarcă firmele...</p>
                            </div>
                        </div>
                        <div class="sidebar-footer">
                            <div class="status-item">
                                <span class="status-dot"></span>
                                Conexiune activă
                            </div>
                            <div class="status-item">
                                <span>📊</span>
                                Versiune sistem 0.0.1
                            </div>
                        </div>
                    </div>

                    <!-- Main content -->
                    <div class="dashboard-content" id="dashboard-content">
                        <div class="welcome-card">
                            <div class="welcome-icon">📁</div>
                            <h3>Selectează o firmă</h3>
                            <p>Alege o firmă din sidebar pentru a vizualiza datele din baza de date</p>
                        </div>
                    </div>
                </div>

                <!-- Footer -->
                <div class="dashboard-footer">
                    <button class="logout-button" onclick="window.location.reload()">
                        Deconectare
                    </button>
                    <div class="footer-timestamp">
                        <span>📅 ${formattedDate}</span>
                        <span>⏱️ ${formattedTime}</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    fetchGuildsDetails();
}

async function fetchGuildsDetails() {
    const guildListContainer = document.getElementById('guild-list');
    const serverCount = document.getElementById('server-count');

    if (!guildListContainer) return;

    try {
        const response = await fetch('/api/guilds/with-names');
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);

        const data = await response.json();
        const allGuilds = data.guilds || [];

        const allowedGuildIds = Object.keys(currentUserServers).filter(id => currentUserServers[id] === true);
        const guilds = allGuilds.filter(guild => allowedGuildIds.includes(guild.id));

        if (guilds.length === 0) {
            guildListContainer.innerHTML = '<div class="no-guilds">Nu ai acces la niciun server</div>';
            serverCount.textContent = '0 firme';
            return;
        }

        serverCount.innerHTML = `<span>${guilds.length}</span> firme disponibile`;

        const guildList = document.createElement('div');
        guildList.className = 'guild-list-items';

        guilds.forEach(guild => {
            const firstLetter = guild.name ? guild.name.charAt(0).toUpperCase() : '?';
            const item = document.createElement('div');
            item.className = `guild-item ${selectedGuildId === guild.id ? 'selected' : ''}`;
            item.setAttribute('data-guild-id', guild.id);
            item.setAttribute('data-guild-name', guild.name);

            const nameDisplay = guild.hasName ? guild.name : `${guild.name} (nume implicit)`;

            item.innerHTML = `
                <div class="guild-icon">${firstLetter}</div>
                <div class="guild-info">
                    <div class="guild-name ${!guild.hasName ? 'default-name' : ''}">${nameDisplay}</div>
                    <div class="guild-id">${guild.id}</div>
                </div>
                ${guild.hasName ? '<div class="guild-db-indicator" title="Nume din baza de date">📁</div>' : ''}
            `;

            item.addEventListener('click', () => {
                document.querySelectorAll('.guild-item').forEach(el => el.classList.remove('selected'));
                item.classList.add('selected');
                selectedGuildId = guild.id;
                selectedGuildName = guild.name;
                expandedTables.clear();
                loadGuildData(guild.id, guild.name);
            });

            guildList.appendChild(item);
        });

        guildListContainer.innerHTML = '';
        guildListContainer.appendChild(guildList);

    } catch (error) {
        console.error('Eroare:', error);
        guildListContainer.innerHTML = '<div class="error-state">Eroare la încărcare</div>';
    }
}

async function loadGuildData(guildId, guildName) {
    const dashboardContent = document.getElementById('dashboard-content');
    if (!dashboardContent) return;

    dashboardContent.innerHTML = `
        <div class="loading-state">
            <div class="loading-spinner"></div>
            <p>Se încarcă datele pentru ${guildName}...</p>
        </div>
    `;

    try {
        const response = await fetch(`/api/guilds/${guildId}/data`);
        if (!response.ok) throw new Error('Nu s-au putut încărca datele');

        const data = await response.json();

        currentGuildData = {
            ...data,
            fullDatabase: { ...data.database },
            guildName: guildName
        };

        console.log('📊 Tabele în baza de date:', Object.keys(data.database));
        console.log('🔑 Permisiuni utilizator:', currentUserPermissions);

        const filteredData = filterDataByPermissions(data, currentUserPermissions);

        await displayGuildData({
            ...filteredData,
            fullDatabase: currentGuildData.fullDatabase
        }, guildId, guildName);

    } catch (error) {
        dashboardContent.innerHTML = `
            <div class="error-state">
                <div class="error-icon">⚠️</div>
                <h4>Eroare la încărcare</h4>
                <p>Nu s-au putut încărca datele pentru ${guildName}.</p>
                <div class="error-details">${error.message}</div>
            </div>
        `;
    }
}

function filterDataByPermissions(data, permissions) {
    if (!data || !data.database) return data;

    const filteredDatabase = {};
    const tableNames = Object.keys(data.database);

    tableNames.forEach(tableName => {
        let matched = false;

        for (const [permKey, possibleNames] of Object.entries(tableNameMapping)) {
            if (possibleNames.includes(tableName)) {
                matched = true;
                if (permissions[permKey] === true) {
                    filteredDatabase[tableName] = data.database[tableName];
                }
                break;
            }
        }
    });

    return {
        ...data,
        database: filteredDatabase
    };
}

function toggleTable(realTableName) {
    if (expandedTables.has(realTableName)) {
        expandedTables.delete(realTableName);
    } else {
        expandedTables.add(realTableName);
    }
    if (currentGuildData) {
        const filteredData = filterDataByPermissions(
            { database: currentGuildData.fullDatabase },
            currentUserPermissions
        );
        displayGuildData({
            ...filteredData,
            fullDatabase: currentGuildData.fullDatabase
        }, selectedGuildId, currentGuildData.guildName || selectedGuildName);
    }
}

async function fetchActiveUsers(guildId) {
    try {
        const response = await fetch(`/api/guilds/${guildId}/active-users`);
        if (!response.ok) throw new Error('Nu s-au putut încărca utilizatorii activi');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Eroare la încărcarea utilizatorilor activi:', error);
        return null;
    }
}

function formatDuration(hours) {
    if (!hours || isNaN(hours)) return '0 min';

    const totalMinutes = Math.round(hours * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;

    if (h === 0) {
        return `${m} min`;
    } else if (m === 0) {
        return `${h} ${h === 1 ? 'oră' : 'ore'}`;
    } else {
        return `${h} ${h === 1 ? 'oră' : 'ore'} ${m} min`;
    }
}

// Funcție pentru a obține numele complet și CNP-ul din tabela CVSubmission
function getUserDetailsFromCV(userId, fullDatabase) {
    if (!fullDatabase) {
        return null;
    }

    const userIdStr = String(userId);

    const possibleTableNames = ['CVSubmission', 'cv_submission', 'CVSubmissions', 'cv_submissions'];
    let cvTable = null;

    for (const tableName of possibleTableNames) {
        if (fullDatabase[tableName]) {
            cvTable = fullDatabase[tableName];
            break;
        }
    }

    if (!cvTable || !cvTable.rows || cvTable.rows.length === 0) {
        return null;
    }

    const userRecord = cvTable.rows.find(row => {
        const possibleIdFields = ['userId', 'user_id', 'id', 'UserId', 'discordId', 'discord_id', 'userid', 'ID'];

        for (const field of possibleIdFields) {
            if (row[field] !== undefined && row[field] !== null) {
                const rowIdStr = String(row[field]);
                if (rowIdStr === userIdStr) {
                    return true;
                }
            }
        }
        return false;
    });

    if (!userRecord) {
        return null;
    }

    const possibleFirstnameFields = ['firstName', 'first_name', 'FirstName', 'nume', 'Nume', 'firstname', 'prenume', 'Prenume'];
    const possibleLastnameFields = ['lastName', 'last_name', 'LastName', 'surname', 'Surname', 'lastname'];
    const possibleCnpFields = ['cnp', 'CNP', 'Cnp', 'codNumericalPersonal', 'cod_numeric_personal'];

    let firstName = '';
    let lastName = '';
    let cnp = '';

    for (const field of possibleFirstnameFields) {
        if (userRecord[field] && userRecord[field] !== null) {
            firstName = String(userRecord[field]).trim();
            break;
        }
    }

    for (const field of possibleLastnameFields) {
        if (userRecord[field] && userRecord[field] !== null) {
            lastName = String(userRecord[field]).trim();
            break;
        }
    }

    for (const field of possibleCnpFields) {
        if (userRecord[field] && userRecord[field] !== null) {
            cnp = String(userRecord[field]).trim();
            break;
        }
    }

    let fullName = null;

    if (firstName && lastName) {
        fullName = `${firstName} ${lastName}`;
    } else if (firstName) {
        fullName = firstName;
    } else if (lastName) {
        fullName = lastName;
    } else {
        const possibleNameFields = ['name', 'Name', 'fullName', 'full_name', 'displayName'];
        for (const field of possibleNameFields) {
            if (userRecord[field] && userRecord[field] !== null) {
                fullName = String(userRecord[field]).trim();
                break;
            }
        }
    }

    return {
        fullName: fullName,
        cnp: cnp
    };
}

// Funcție pentru a procesa tabelul TimeEntry și a adăuga informații din CV
function processTimeEntryTable(table, fullDatabase) {
    if (!table || !table.rows) return table;

    // Creăm o copie a tabelului
    const processedTable = {
        ...table,
        columns: [...table.columns],
        rows: []
    };

    // Adăugăm o coloană nouă pentru informațiile din CV
    const cvInfoColumn = {
        name: 'employeeInfo',
        type: 'TEXT'
    };
    processedTable.columns.push(cvInfoColumn);

    // Procesăm fiecare rând
    processedTable.rows = table.rows.map(row => {
        const newRow = { ...row };

        // Găsim userId în rând
        const userId = row['userId'] || row['user_id'] || row['UserId'];

        if (userId) {
            const userDetails = getUserDetailsFromCV(userId, fullDatabase);
            if (userDetails && (userDetails.fullName || userDetails.cnp)) {
                const displayName = userDetails.fullName || 'Nume indisponibil';
                const cnpDisplay = userDetails.cnp || 'CNP indisponibil';
                newRow.employeeInfo = `${displayName}\n${cnpDisplay}`;
            } else {
                newRow.employeeInfo = 'Fără date CV';
            }
        } else {
            newRow.employeeInfo = 'ID invalid';
        }

        return newRow;
    });

    return processedTable;
}

async function displayGuildData(data, guildId, guildName) {
    const dashboardContent = document.getElementById('dashboard-content');
    if (!dashboardContent) return;

    const database = { ...data.database };
    const fullDatabase = data.fullDatabase || database;
    const tableNames = Object.keys(database);

    // Procesăm tabelul TimeEntry dacă există
    for (const tableName of tableNames) {
        if (tableNameMapping['TimeEntry'].includes(tableName)) {
            database[tableName] = processTimeEntryTable(database[tableName], fullDatabase);
            break;
        }
    }

    const activeUsersData = await fetchActiveUsers(guildId);

    const processedActiveUsers = [];

    if (activeUsersData && activeUsersData.activeUsers && activeUsersData.activeUsers.length > 0) {
        for (const user of activeUsersData.activeUsers) {
            const userDetails = getUserDetailsFromCV(user.userId, fullDatabase);

            let displayName = user.username || `User ${user.userId}`;

            if (userDetails && userDetails.fullName) {
                displayName = userDetails.fullName;
            }

            const cnp = (userDetails && userDetails.cnp) ? userDetails.cnp : '';

            processedActiveUsers.push({
                ...user,
                displayName: displayName,
                cnp: cnp,
                hasCVData: !!(userDetails && (userDetails.fullName || userDetails.cnp))
            });
        }
    }

    if (tableNames.length === 0) {
        let activeUsersHtml = '';

        if (processedActiveUsers.length > 0) {
            const usersList = processedActiveUsers.map(user => {
                const duration = user.duration ? formatDuration(user.duration) : 'necunoscută';
                const displayName = user.displayName;
                const firstLetter = displayName ? displayName.charAt(0).toUpperCase() : '?';
                const cnpDisplay = user.cnp ? user.cnp : 'CNP indisponibil';

                return `
                    <div class="active-user-item ${user.hasCVData ? 'has-cv-data' : ''}" title="ID: ${user.userId}">
                        <div class="active-user-avatar">${firstLetter}</div>
                        <div class="active-user-info">
                            <div class="active-user-name">
                                ${displayName}
                                ${user.hasCVData ? '<span class="cv-badge" title="Date din CVSubmission">📋</span>' : ''}
                            </div>
                            <div class="active-user-details">
                                <span class="active-user-id">${user.userId}</span>
                                <span class="active-user-cnp" title="CNP">🆔 ${cnpDisplay}</span>
                                <span class="active-user-duration">⏱️ ${duration}</span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            activeUsersHtml = `
                <div class="active-users-card">
                    <div class="card-title">
                        <span>🟢 UTILIZATORI ACTIVI (${processedActiveUsers.length}/${activeUsersData.totalUsers})</span>
                    </div>
                    <div class="active-users-list">
                        ${usersList}
                    </div>
                </div>
            `;
        } else if (activeUsersData) {
            activeUsersHtml = `
                <div class="active-users-card empty">
                    <div class="card-title">
                        <span>⚪ UTILIZATORI ACTIVI (0/${activeUsersData.totalUsers})</span>
                    </div>
                    <div class="empty-message">Nu există utilizatori activi momentan</div>
                </div>
            `;
        }

        dashboardContent.innerHTML = `
            <div class="guild-data-header">
                <div class="guild-info-compact">
                    <div class="guild-icon-large">${guildName ? guildName.charAt(0).toUpperCase() : guildId.charAt(0)}</div>
                    <div class="guild-meta">
                        <h4>${guildName || `Firma ${guildId}`}</h4>
                        <span>ID: ${guildId} • ${formatDateTime(new Date().toISOString())}</span>
                    </div>
                </div>
                <div class="data-meta">
                    <span class="table-count-badge">0 tabele accesibile</span>
                </div>
            </div>
            ${activeUsersHtml}
            <div class="empty-state">Nu ai permisiuni pentru niciun tabel din această bază de date</div>
        `;
        return;
    }

    let tablesHtml = '';

    tableNames.forEach(tableName => {
        const table = database[tableName];
        const isExpanded = expandedTables.has(tableName);
        const totalRecords = table.rowCount;

        const config = getTableColumnConfig(tableName);

        let columnsToDisplay = table.columns;

        if (config && config.enabled) {
            const enabledFields = config.columns
                .filter(col => col.enabled)
                .map(col => col.field);

            columnsToDisplay = table.columns.filter(col => enabledFields.includes(col.name));
        }

        if (columnsToDisplay.length === 0) return;

        const headers = columnsToDisplay.map(col => {
            const headerText = getColumnHeader(col.name, tableName);
            return `<th>${headerText}<br><span style="font-weight:400; font-size:0.7rem;">${col.type}</span></th>`;
        }).join('');

        const rows = table.rows.map(row => {
            const cells = columnsToDisplay.map(col => {
                const value = row[col.name];

                if (value === null || value === undefined) {
                    return '<td><span class="null-value">NULL</span></td>';
                }

                if (col.name === 'employeeInfo' && value && value.includes('\n')) {
                    const [name, cnp] = value.split('\n');
                    return `<td><div class="employee-info">${name}<br><small>${cnp}</small></div></td>`;
                }

                if (typeof value === 'boolean' || value === 0 || value === 1) {
                    const boolValue = value === true || value === 1;
                    return `<td><span class="boolean-value ${boolValue ? 'true' : 'false'}">${boolValue ? '✓' : '✗'}</span></td>`;
                }

                if (isDateTimeField(col.name) && typeof value === 'string') {
                    const formattedValue = formatDateTime(value);
                    return `<td>${formattedValue}</td>`;
                }

                return `<td>${value}</td>`;
            }).join('');
            return `<tr>${cells}</tr>`;
        }).join('');

        const collapseIcon = isExpanded ? '▼' : '▶';
        const tableContent = isExpanded ? `
            <div class="table-wrapper">
                <table class="data-table">
                    <thead>
                        <tr>${headers}</tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>
        ` : '';

        const displayName = getTableDisplayName(tableName);
        const tableIcon = getTableIcon(tableName);
        const cleanName = getTableCleanName(tableName);

        tablesHtml += `
            <div class="table-card">
                <div class="table-header ${isExpanded ? 'expanded' : ''}" onclick="toggleTable('${tableName}')" style="cursor: pointer;">
                    <div class="table-title">
                        <div class="table-icon">${tableIcon}</div>
                        <h4>${cleanName}</h4>
                    </div>
                    <div class="table-stats">
                        <span class="record-count">${totalRecords} înregistrări</span>
                        <span class="column-count">${columnsToDisplay.length} coloane</span>
                        <span class="collapse-icon">${collapseIcon}</span>
                    </div>
                </div>
                ${tableContent}
            </div>
        `;
    });

    let activeUsersHtml = '';

    if (processedActiveUsers.length > 0) {
        const usersList = processedActiveUsers.map(user => {
            const duration = user.duration ? formatDuration(user.duration) : 'necunoscută';
            const displayName = user.displayName;
            const firstLetter = displayName ? displayName.charAt(0).toUpperCase() : '?';
            const cnpDisplay = user.cnp ? user.cnp : 'CNP indisponibil';

            return `
                <div class="active-user-item ${user.hasCVData ? 'has-cv-data' : ''}" title="ID: ${user.userId}">
                    <div class="active-user-avatar">${firstLetter}</div>
                    <div class="active-user-info">
                        <div class="active-user-name">
                            ${displayName}
                            ${user.hasCVData ? '<span class="cv-badge" title="Date din CVSubmission">📋</span>' : ''}
                        </div>
                        <div class="active-user-details">
                            <span class="active-user-id">${user.userId}</span>
                            <span class="active-user-cnp" title="CNP">🆔 ${cnpDisplay}</span>
                            <span class="active-user-duration">⏱️ ${duration}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        activeUsersHtml = `
            <div class="active-users-card">
                <div class="card-title">
                    <span>🟢 UTILIZATORI ACTIVI (${processedActiveUsers.length}/${activeUsersData.totalUsers})</span>
                </div>
                <div class="active-users-list">
                    ${usersList}
                </div>
            </div>
        `;
    } else if (activeUsersData) {
        activeUsersHtml = `
            <div class="active-users-card empty">
                <div class="card-title">
                    <span>⚪ UTILIZATORI ACTIVI (0/${activeUsersData.totalUsers})</span>
                </div>
                <div class="empty-message">Nu există utilizatori activi momentan</div>
            </div>
        `;
    }

    const totalRecordsAll = Object.values(database).reduce((acc, t) => acc + t.rowCount, 0);
    const accessibleTables = tableNames.length;
    const totalTables = Object.keys(fullDatabase).length;

    dashboardContent.innerHTML = `
        <div class="guild-data-header">
            <div class="guild-info-compact">
                <div class="guild-icon-large">${guildName ? guildName.charAt(0).toUpperCase() : guildId.charAt(0)}</div>
                <div class="guild-meta">
                    <h4>${guildName || `Firma ${guildId}`}</h4>
                    <span>ID: ${guildId} • Actualizat: ${formatDateTime(new Date().toISOString())}</span>
                </div>
            </div>
            <div class="data-meta">
                <span class="table-count-badge">${accessibleTables} / ${totalTables} tabele accesibile</span>
                <button class="stats-button" id="stats-button-${guildId}">
                    <span class="stats-icon">📊</span>
                    <span class="stats-text">Statistici Avansate</span>
                    <span class="stats-count">${totalRecordsAll} înreg.</span>
                </button>
            </div>
        </div>
        ${activeUsersHtml}
        ${tablesHtml}
    `;

    // Atașăm event listener pentru butonul de statistici (ca în loginScreen)
    setTimeout(() => {
        const statsBtn = document.getElementById(`stats-button-${guildId}`);
        if (statsBtn) {
            statsBtn.addEventListener('click', () => {
                import('./guildDetailsScreen.js').then(module => {
                    module.showGuildDetailsScreen(guildId, guildName, userDataGlobal, discordUsername);
                });
            });
        }
    }, 0);

    document.querySelectorAll('.table-header').forEach(header => {
        header.removeEventListener('click', header._clickHandler);
        header._clickHandler = function(e) {
            e.stopPropagation();
            const onclickAttr = this.getAttribute('onclick');
            if (onclickAttr) {
                const match = onclickAttr.match(/toggleTable\('([^']+)'\)/);
                if (match && match[1]) {
                    const realTableName = match[1];
                    toggleTable(realTableName);
                }
            }
        };
        header.addEventListener('click', header._clickHandler);
    });
}

export { getUserDetailsFromCV };

window.toggleTable = toggleTable;