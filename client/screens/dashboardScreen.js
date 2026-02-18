import './dashboardScreen.css';
import rocketLogo from '/logo.png';
import { authorizedUsers } from '../configs/config.js';

let currentGuildData = null;
let selectedGuildId = null;
let expandedTables = new Set();
let currentUserPermissions = null;
let currentUserServers = null; // Nou: lista de servere permise

export function showDashboardScreen(userData, currentUser, discordUsername) {
    const app = document.querySelector('#app');

    // Salvează permisiunile și serverele utilizatorului curent
    currentUserPermissions = userData.permissions || {};
    currentUserServers = userData.servers || {}; // Nou

    const now = new Date();
    const formattedDate = now.toLocaleDateString('ro-RO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const formattedTime = now.toLocaleTimeString('ro-RO', {
        hour: '2-digit',
        minute: '2-digit'
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

        // Filtrează doar serverele la care utilizatorul are acces
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

        // Salvează datele complete într-un câmp separat
        currentGuildData = {
            ...data,
            fullDatabase: { ...data.database } // copie a tuturor tabelelor
        };

        console.log('📊 Tabele în baza de date:', Object.keys(data.database));
        console.log('🔑 Permisiuni utilizator:', currentUserPermissions);

        // Filtrează datele în funcție de permisiuni
        const filteredData = filterDataByPermissions(data, currentUserPermissions);

        // Afișează datele filtrate, dar trimite și referința la datele complete
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

// Funcție care filtrează datele în funcție de permisiuni
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

function filterDataByPermissions(data, permissions) {
    if (!data || !data.database) return data;

    const filteredDatabase = {};
    const tableNames = Object.keys(data.database);

    console.log('🔍 ===== FILTRARE DATE =====');
    console.log('📋 Tabele în baza de date:', tableNames);
    console.log('🔑 Permisiuni utilizator:', permissions);
    console.log('📊 Mapping disponibil:', Object.keys(tableNameMapping));

    tableNames.forEach(tableName => {
        let matched = false;
        let matchedPermission = null;

        // Verifică dacă acest nume de tabel se potrivește cu vreo permisiune
        for (const [permKey, possibleNames] of Object.entries(tableNameMapping)) {
            if (possibleNames.includes(tableName)) {
                matched = true;
                matchedPermission = permKey;

                if (permissions[permKey] === true) {
                    console.log(`✅ Tabel "${tableName}" -> permis (se potrivește cu "${permKey}" = true)`);
                    filteredDatabase[tableName] = data.database[tableName];
                } else {
                    console.log(`❌ Tabel "${tableName}" -> nepermis (se potrivește cu "${permKey}" = false)`);
                }
                break;
            }
        }

        if (!matched) {
            console.log(`⚠️ Tabel "${tableName}" -> nu se potrivește cu niciun mapping`);
        }
    });

    console.log('🏁 Tabele permise:', Object.keys(filteredDatabase));
    console.log('🔍 ===== SFÂRȘIT FILTRARE =====');

    return {
        ...data,
        database: filteredDatabase
    };
}

function toggleTable(tableName) {
    if (expandedTables.has(tableName)) {
        expandedTables.delete(tableName);
    } else {
        expandedTables.add(tableName);
    }
    // Reafișează datele folosind currentGuildData care conține atât filtrate, cât și complete
    if (currentGuildData) {
        const filteredData = filterDataByPermissions(
            { database: currentGuildData.fullDatabase },
            currentUserPermissions
        );
        displayGuildData({
            ...filteredData,
            fullDatabase: currentGuildData.fullDatabase
        }, selectedGuildId, currentGuildData?.guildName);
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

async function displayGuildData(data, guildId, guildName) {
    const dashboardContent = document.getElementById('dashboard-content');
    if (!dashboardContent) return;

    const database = data.database; // tabelele filtrate (permise)
    const fullDatabase = data.fullDatabase || database; // fallback la database dacă nu există fullDatabase
    const tableNames = Object.keys(database);

    // Încărcăm utilizatorii activi
    const activeUsersData = await fetchActiveUsers(guildId);

    if (tableNames.length === 0) {
        let activeUsersHtml = '';

        if (activeUsersData && activeUsersData.totalActive > 0) {
            const usersList = activeUsersData.activeUsers.map(user => {
                const duration = user.duration ? formatDuration(user.duration) : 'necunoscută';
                return `
                    <div class="active-user-item">
                        <div class="active-user-avatar">${user.username.charAt(0).toUpperCase()}</div>
                        <div class="active-user-info">
                            <div class="active-user-name">${user.username}</div>
                            <div class="active-user-details">
                                <span class="active-user-id">ID: ${user.userId}</span>
                                <span class="active-user-duration">⏱️ ${duration}</span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            activeUsersHtml = `
                <div class="active-users-card">
                    <div class="card-title">
                        <span>🟢 UTILIZATORI ACTIVI (${activeUsersData.totalActive}/${activeUsersData.totalUsers})</span>
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
                        <span>ID: ${guildId} • ${new Date().toLocaleString('ro-RO')}</span>
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

        const headers = table.columns.map(col =>
            `<th>${col.name}<br><span style="font-weight:400; font-size:0.7rem;">${col.type}</span></th>`
        ).join('');

        const rows = table.rows.map(row => {
            const cells = table.columns.map(col => {
                const value = row[col.name];
                if (value === null || value === undefined) {
                    return '<td><span class="null-value">NULL</span></td>';
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

        tablesHtml += `
            <div class="table-card">
                <div class="table-header" onclick="toggleTable('${tableName}')" style="cursor: pointer;">
                    <div class="table-title">
                        <div class="table-icon">📋</div>
                        <h4>${tableName}</h4>
                    </div>
                    <div class="table-stats">
                        <span class="record-count">${totalRecords} înregistrări</span>
                        <span class="column-count">${table.columns.length} coloane</span>
                        <span class="collapse-icon">${collapseIcon}</span>
                    </div>
                </div>
                ${tableContent}
            </div>
        `;
    });

    // Construim secțiunea cu utilizatori activi
    let activeUsersHtml = '';

    if (activeUsersData && activeUsersData.totalActive > 0) {
        const usersList = activeUsersData.activeUsers.map(user => {
            const duration = user.duration ? formatDuration(user.duration) : 'necunoscută';
            return `
                <div class="active-user-item">
                    <div class="active-user-avatar">${user.username.charAt(0).toUpperCase()}</div>
                    <div class="active-user-info">
                        <div class="active-user-name">${user.username}</div>
                        <div class="active-user-details">
                            <span class="active-user-id">ID: ${user.userId}</span>
                            <span class="active-user-duration">⏱️ ${duration}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        activeUsersHtml = `
            <div class="active-users-card">
                <div class="card-title">
                    <span>🟢 UTILIZATORI ACTIVI (${activeUsersData.totalActive}/${activeUsersData.totalUsers})</span>
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
                    <span>ID: ${guildId} • Actualizat: ${new Date().toLocaleString('ro-RO')}</span>
                </div>
            </div>
            <div class="data-meta">
                <span class="table-count-badge">${accessibleTables} / ${totalTables} tabele accesibile</span>
                <span class="timestamp">📊 Total: ${totalRecordsAll} înregistrări</span>
            </div>
        </div>
        ${activeUsersHtml}
        ${tablesHtml}
    `;

    document.querySelectorAll('.table-header').forEach(header => {
        header.addEventListener('click', function(e) {
            e.stopPropagation();
            const card = this.closest('.table-card');
            const titleElement = card.querySelector('.table-title h4');
            if (titleElement) {
                const tableName = titleElement.textContent;
                toggleTable(tableName);
            }
        });
    });
}

window.toggleTable = toggleTable;