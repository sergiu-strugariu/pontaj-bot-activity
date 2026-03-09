import './guildDetailsScreen.css';
import rocketLogo from '/logo.png';
import { getUserDetailsFromCV } from './dashboardScreen.js'; // Importăm funcția existentă

let currentGuildId = null;
let currentGuildName = null;
let currentUserData = null;
let currentDiscordUsername = null;
let currentGuildDetails = null;
let currentFullDatabase = null; // Adăugăm pentru a stoca baza de date completă

// Variabile pentru panouri
let activePanel = 'overview';

export function showGuildDetailsScreen(guildId, guildName, userData, discordUsername) {
    const app = document.querySelector('#app');
    currentGuildId = guildId;
    currentGuildName = guildName;
    currentUserData = userData;
    currentDiscordUsername = discordUsername;

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
                    <!-- Sidebar Info -->
                    <div class="details-sidebar">
                        <button class="back-button" id="back-to-dashboard">
                            <span class="back-icon">←</span>
                            Înapoi la Dashboard
                        </button>
                        
                        <div class="company-profile">
                            <div class="company-icon-large">${guildName ? guildName.charAt(0).toUpperCase() : 'F'}</div>
                            <h2 class="company-name">${guildName || `Firma ${guildId}`}</h2>
                            <div class="company-id">ID: ${guildId}</div>
                        </div>

                        <div class="stats-summary">
                            <div class="stat-item">
                                <span class="stat-label">Total Tabele</span>
                                <span class="stat-value" id="total-tables">-</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Total Înregistrări</span>
                                <span class="stat-value" id="total-records">-</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Bază Date</span>
                                <span class="stat-value" id="db-size">-</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Ultima Actualizare</span>
                                <span class="stat-value" id="last-update">-</span>
                            </div>
                        </div>

                        <!-- Butoane de navigare panouri -->
                        <div class="panel-navigation">
                            <button class="panel-button active" data-panel="overview">
                                <span class="panel-icon">📊</span>
                                <span class="panel-name">Dashboard</span>
                            </button>
<!--                            <button class="panel-button" data-panel="users">-->
<!--                                <span class="panel-icon">👥</span>-->
<!--                                <span class="panel-name">Utilizatori</span>-->
<!--                            </button>-->
                            <button class="panel-button" data-panel="stats">
                                <span class="panel-icon">📈</span>
                                <span class="panel-name">Statistici</span>
                            </button>
                            <button class="panel-button" data-panel="leaderboard">
                                <span class="panel-icon">🏆</span>
                                <span class="panel-name">Clasament</span>
                            </button>
<!--                            <button class="panel-button" data-panel="export">-->
<!--                                <span class="panel-icon">📤</span>-->
<!--                                <span class="panel-name">Export</span>-->
<!--                            </button>-->
                        </div>
                    </div>

                    <!-- Main content -->
                    <div class="details-content" id="details-content">
                        <div class="loading-state">
                            <div class="loading-spinner"></div>
                            <p>Se încarcă informațiile firmei...</p>
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

    // Atașăm event listener pentru butonul de back
    setTimeout(() => {
        const backButton = document.getElementById('back-to-dashboard');
        if (backButton) {
            backButton.addEventListener('click', () => {
                import('./dashboardScreen.js').then(module => {
                    module.showDashboardScreen(currentUserData, { id: currentGuildId }, currentDiscordUsername);
                });
            });
        }

        // Atașăm event listener pentru butoanele de panou
        document.querySelectorAll('.panel-button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Elimină clasa active de la toate butoanele
                document.querySelectorAll('.panel-button').forEach(b => b.classList.remove('active'));
                // Adaugă clasa active la butonul apăsat
                btn.classList.add('active');
                // Schimbă panoul activ
                activePanel = btn.dataset.panel;
                // Reafișează datele
                if (currentGuildDetails) {
                    displayGuildDetails(currentGuildDetails);
                }
            });
        });
    }, 0);

    // Încărcăm datele detaliate și baza de date completă
    loadGuildDetails(guildId);
    loadFullDatabase(guildId);
}

// Funcție nouă pentru a încărca baza de date completă
async function loadFullDatabase(guildId) {
    try {
        const response = await fetch(`/api/guilds/${guildId}/data`);
        if (!response.ok) throw new Error('Nu s-a putut încărca baza de date');

        const data = await response.json();
        currentFullDatabase = data.database;
    } catch (error) {
        console.error('Eroare la încărcarea bazei de date:', error);
    }
}

async function loadGuildDetails(guildId) {
    try {
        // Încărcăm toate datele în paralel
        const [detailsRes, usersRes, monthlyRes, configRes] = await Promise.all([
            fetch(`/api/guilds/${guildId}/details`),
            fetch(`/api/guilds/${guildId}/users`),
            fetch(`/api/guilds/${guildId}/monthly-stats`),
            fetch(`/api/guilds/${guildId}/config`)
        ]);

        if (!detailsRes.ok) throw new Error('Nu s-au putut încărca detaliile');
        if (!usersRes.ok) throw new Error('Nu s-au putut încărca utilizatorii');
        if (!monthlyRes.ok) throw new Error('Nu s-au putut încărca statisticile lunare');
        if (!configRes.ok) throw new Error('Nu s-a putut încărca configurația');

        const [details, users, monthly, config] = await Promise.all([
            detailsRes.json(),
            usersRes.json(),
            monthlyRes.json(),
            configRes.json()
        ]);

        // Procesăm utilizatorii cu date din CV
        const processedUsers = users.users.map(user => {
            let cvDetails = null;
            if (currentFullDatabase) {
                cvDetails = getUserDetailsFromCV(user.userId, currentFullDatabase);
            }

            return {
                ...user,
                displayName: cvDetails?.fullName || user.username || `User ${user.userId}`,
                displayCnp: cvDetails?.cnp || null
            };
        });

        // Procesăm utilizatorii activi
        const processedActiveUsers = users.activeUsersList.map(activeUser => {
            const userFull = processedUsers.find(u => u.userId === activeUser.userId);
            return {
                ...activeUser,
                username: userFull?.displayName || activeUser.username
            };
        });

        // Combinăm toate datele
        const enhancedData = {
            ...details,
            ...users,
            ...monthly,
            ...config,
            allUsers: processedUsers,
            activeUsersList: processedActiveUsers
        };

        currentGuildDetails = enhancedData;
        displayGuildDetails(enhancedData);

    } catch (error) {
        console.error('Eroare la încărcarea detaliilor:', error);
        const detailsContent = document.getElementById('details-content');
        if (detailsContent) {
            detailsContent.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">⚠️</div>
                    <h4>Eroare la încărcare</h4>
                    <p>Nu s-au putut încărca informațiile firmei.</p>
                    <div class="error-details">${error.message}</div>
                </div>
            `;
        }
    }
}

// Funcții helper pentru formatare
function formatHours(hours) {
    if (typeof hours !== 'number' || isNaN(hours)) {
        return '0 ore 0 min';
    }

    const totalMinutes = Math.round(hours * 60);
    const formattedHours = Math.floor(totalMinutes / 60);
    const formattedMinutes = totalMinutes % 60;

    const hoursText = formattedHours === 1 ? 'oră' : 'ore';
    const minutesText = formattedMinutes === 1 ? 'minut' : 'minute';

    if (formattedHours === 0) {
        return `${formattedMinutes} ${minutesText}`;
    } else if (formattedMinutes === 0) {
        return `${formattedHours} ${hoursText}`;
    } else {
        return `${formattedHours} ${hoursText} ${formattedMinutes} ${minutesText}`;
    }
}

function formatMoney(value) {
    return `$${parseFloat(value || 0).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}

function formatRate(value) {
    return `$${parseFloat(value || 0).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}/h`;
}

function formatDateTime(value) {
    if (!value) return 'N/A';
    try {
        const date = new Date(value);
        if (isNaN(date.getTime())) return value;
        return date.toLocaleDateString('ro-RO', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return value;
    }
}

// Panoul Overview (Dashboard principal)
function renderOverviewPanel(data) {
    return `
        <div class="panel overview-panel">
            <div class="stats-section">
                <h3 class="section-title">📊 Dashboard Administrator</h3>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-card-icon">👥</div>
                        <div class="stat-card-content">
                            <span class="stat-card-label">Utilizatori</span>
                            <span class="stat-card-value">${data.totalUsers || 0}</span>
                            <small>Activi: ${data.activeUsers || 0}</small>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-card-icon">📈</div>
                        <div class="stat-card-content">
                            <span class="stat-card-label">Luna curentă</span>
                            <span class="stat-card-value">${formatHours(data.monthlyHours || 0)}</span>
                            <small>Câștig: ${formatMoney(data.monthlyEarnings || 0)}</small>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-card-icon">⚙️</div>
                        <div class="stat-card-content">
                            <span class="stat-card-label">Setări</span>
                            <span class="stat-card-value">Sistem: ${data.systemActive ? '✅ Activ' : '❌ Inactiv'}</span>
                            <small>Monedă: ${data.currency || '$'}</small>
                        </div>
                    </div>
                </div>
            </div>

            ${data.activeUsersList && data.activeUsersList.length > 0 ? `
            <div class="users-section">
                <h3 class="section-title">🟢 Utilizatori activi (${data.activeUsersList.length})</h3>
                <div class="active-users-list">
                    ${data.activeUsersList.map(user => {
        const userFull = data.allUsers?.find(u => u.userId === user.userId);
        const displayName = userFull?.displayName || user.username;
        const displayCnp = userFull?.displayCnp;
        return `
                            <div class="active-user-item" title="CNP: ${displayCnp || 'N/A'}">
                                <div class="active-user-avatar">${displayName ? displayName.charAt(0).toUpperCase() : '?'}</div>
                                <div class="active-user-info">
                                    <div class="active-user-name">${displayName}</div>
                                    <div class="active-user-details">
                                        <span class="active-user-id">${user.userId}</span>
                                        ${displayCnp ? `<span class="active-user-cnp">🆔 ${displayCnp}</span>` : ''}
                                        <span class="active-user-duration">⏱️ ${formatHours(user.duration)}</span>
                                    </div>
                                </div>
                            </div>
                        `;
    }).join('')}
                </div>
            </div>
            ` : ''}

            <div class="stats-section">
                <h3 class="section-title">📊 Statistici totale</h3>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-card-content">
                            <span class="stat-card-label">Ore totale</span>
                            <span class="stat-card-value">${formatHours(data.totalHours || 0)}</span>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-card-content">
                            <span class="stat-card-label">Câștig total</span>
                            <span class="stat-card-value">${formatMoney(data.totalEarnings || 0)}</span>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-card-content">
                            <span class="stat-card-label">Sesiuni totale</span>
                            <span class="stat-card-value">${data.totalSessions || 0}</span>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-card-content">
                            <span class="stat-card-label">Rată medie orară</span>
                            <span class="stat-card-value">${formatRate(data.avgHourlyRate || 0)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Panoul Utilizatori
function renderUsersPanel(data) {
    return `
        <div class="panel users-panel">
            <h3 class="section-title">👥 Toți utilizatorii</h3>
            <div class="users-table-container">
                <table class="users-table">
                    <thead>
                        <tr>
                            <th>Utilizator</th>
                            <th>CNP</th>
                            <th>Ore</th>
                            <th>Câștig</th>
                            <th>Sesiuni</th>
                            <th>Rată/h</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${(data.allUsers || []).map(user => `
                            <tr>
                                <td>
                                    <div class="user-cell">
                                        <span class="user-avatar-small">${user.displayName ? user.displayName.charAt(0).toUpperCase() : '?'}</span>
                                        <span>${user.displayName || 'Necunoscut'}</span>
                                    </div>
                                    <small>ID: ${user.userId}</small>
                                </td>
                                <td><span class="cnp-cell">${user.displayCnp || '-'}</span></td>
                                <td>${formatHours(user.totalHours || 0)}</td>
                                <td>${formatMoney(user.totalEarnings || 0)}</td>
                                <td>${user.totalSessions || 0}</td>
                                <td>${formatRate(user.hourlyRate || 0)}</td>
                                <td><span class="status-badge ${user.isClockedIn ? 'active' : 'inactive'}">${user.isClockedIn ? 'ACTIV' : 'INACTIV'}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// Panoul Statistici
function renderStatsPanel(data) {
    return `
        <div class="panel stats-panel">
            <h3 class="section-title">📈 Statistici detaliate</h3>
            <div class="stats-grid">
                <div class="stat-card large">
                    <div class="stat-card-icon">📊</div>
                    <div class="stat-card-content">
                        <span class="stat-card-label">Medie înregistrări/tabel</span>
                        <span class="stat-card-value">${data.avgRecordsPerTable}</span>
                    </div>
                </div>
                <div class="stat-card large">
                    <div class="stat-card-icon">📏</div>
                    <div class="stat-card-content">
                        <span class="stat-card-label">Medie coloane/tabel</span>
                        <span class="stat-card-value">${data.avgColumnsPerTable || 0}</span>
                    </div>
                </div>
                <div class="stat-card large">
                    <div class="stat-card-icon">📁</div>
                    <div class="stat-card-content">
                        <span class="stat-card-label">Tipuri date diferite</span>
                        <span class="stat-card-value">${data.uniqueDataTypes}</span>
                    </div>
                </div>
                <div class="stat-card large">
                    <div class="stat-card-icon">🏆</div>
                    <div class="stat-card-content">
                        <span class="stat-card-label">Tabela cu cele mai multe înreg.</span>
                        <span class="stat-card-value">${data.mostPopulatedTable || 'N/A'}</span>
                        <small>${data.maxRowsInTable || 0} înregistrări</small>
                    </div>
                </div>
            </div>

            <h3 class="section-title">📊 Statistici lunare</h3>
            <div class="monthly-stats">
                ${(data.monthlyStats || []).map(month => `
                    <div class="month-card">
                        <h4>${month.name}</h4>
                        <div class="month-stats">
                            <div><span class="stat-label">Ore:</span> ${formatHours(month.hours)}</div>
                            <div><span class="stat-label">Câștig:</span> ${formatMoney(month.earnings)}</div>
                            <div><span class="stat-label">Sesiuni:</span> ${month.sessions}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Panoul Clasament - FILTRAT: doar utilizatori cu cel puțin 10 minute (0.1667 ore)
function renderLeaderboardPanel(data) {
    const users = data.allUsers || [];

    // Filtrare: doar utilizatori cu cel puțin 10 minute (10/60 = 0.1667 ore)
    const MIN_HOURS = 10 / 60; // 10 minute în ore
    const filteredUsers = users.filter(user => (user.totalHours || 0) >= MIN_HOURS);

    // Sortare după câștig
    const sortedUsers = [...filteredUsers].sort((a, b) => (b.totalEarnings || 0) - (a.totalEarnings || 0));

    if (sortedUsers.length === 0) {
        return `
            <div class="panel leaderboard-panel"
                <h3 class="section-title">🏆 Clasament - Câștig total</h3>
                <div class="empty-state">Nu există utilizatori cu minim 10 minute lucrate</div>
            </div>
        `;
    }

    return `
        <div class="panel leaderboard-panel">
            <h3 class="section-title">🏆 Clasament - Câștig total (minim 10 minute)</h3>
            <div class="leaderboard">
                ${sortedUsers.map((user, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
        return `
                        <div class="leaderboard-item ${index < 3 ? 'top-three' : ''}">
                            <div class="leaderboard-rank">${medal}</div>
                            <div class="leaderboard-user">
                                <span class="user-avatar-small">${user.displayName ? user.displayName.charAt(0).toUpperCase() : '?'}</span>
                                <div class="user-info">
                                    <span class="user-name">${user.displayName || 'Necunoscut'}</span>
                                    <div class="user-details">
                                        <small>ID: ${user.userId}</small>
                                        ${user.displayCnp ? `<small class="user-cnp">CNP: ${user.displayCnp}</small>` : ''}
                                    </div>
                                </div>
                            </div>
                            <div class="leaderboard-stats">
                                <span class="stat">💰 ${formatMoney(user.totalEarnings || 0)}</span>
                                <span class="stat">⏱️ ${formatHours(user.totalHours || 0)}</span>
                                <span class="stat">📊 ${user.totalSessions || 0} sesiuni</span>
                            </div>
                        </div>
                    `;
    }).join('')}
            </div>
        </div>
    `;
}

// Panoul Export
function renderExportPanel(data) {
    return `
        <div class="panel export-panel">
            <h3 class="section-title">📤 Export date</h3>
            <div class="export-options">
                <button class="export-button" data-format="table">
                    <span class="export-icon">📋</span>
                    <span class="export-name">Tabel simplu</span>
                </button>
                <button class="export-button" data-format="csv">
                    <span class="export-icon">📊</span>
                    <span class="export-name">CSV</span>
                </button>
                <button class="export-button" data-format="json">
                    <span class="export-icon">📦</span>
                    <span class="export-name">JSON</span>
                </button>
            </div>
            <div class="export-preview">
                <h4>Previzualizare date</h4>
                <pre class="export-preview-content">${JSON.stringify({
        server: {
            id: currentGuildId,
            name: currentGuildName,
            exportDate: new Date().toISOString()
        },
        users: (data.allUsers || []).map(u => ({
            userId: u.userId,
            username: u.username,
            displayName: u.displayName,
            cnp: u.displayCnp,
            totalHours: u.totalHours,
            totalEarnings: u.totalEarnings,
            totalSessions: u.totalSessions,
            hourlyRate: u.hourlyRate,
            isClockedIn: u.isClockedIn
        })),
        summary: {
            totalUsers: data.totalUsers || 0,
            activeUsers: data.activeUsers || 0,
            totalHours: data.totalHours || 0,
            totalEarnings: data.totalEarnings || 0,
            totalSessions: data.totalSessions || 0
        }
    }, null, 2)}</pre>
            </div>
        </div>
    `;
}

function displayGuildDetails(data) {
    const detailsContent = document.getElementById('details-content');
    const totalTablesSpan = document.getElementById('total-tables');
    const totalRecordsSpan = document.getElementById('total-records');
    const dbSizeSpan = document.getElementById('db-size');
    const lastUpdateSpan = document.getElementById('last-update');

    // Actualizăm sidebar-ul cu statistici
    if (totalTablesSpan) totalTablesSpan.textContent = data.totalTables;
    if (totalRecordsSpan) totalRecordsSpan.textContent = data.totalRecords.toLocaleString('ro-RO');
    if (dbSizeSpan) dbSizeSpan.textContent = data.dbSize;
    if (lastUpdateSpan) lastUpdateSpan.textContent = data.lastUpdate;

    // Calculează statistici totale din utilizatori
    const totalHours = data.allUsers?.reduce((sum, u) => sum + (u.totalHours || 0), 0) || 0;
    const totalEarnings = data.allUsers?.reduce((sum, u) => sum + (u.totalEarnings || 0), 0) || 0;
    const totalSessions = data.allUsers?.reduce((sum, u) => sum + (u.totalSessions || 0), 0) || 0;
    const avgHourlyRate = data.allUsers?.length
        ? data.allUsers.reduce((sum, u) => sum + (u.hourlyRate || 0), 0) / data.allUsers.length
        : 0;

    // Calculează statistici lunare curente
    const currentMonth = data.monthlyStats?.[data.monthlyStats.length - 1] || { hours: 0, earnings: 0, sessions: 0 };

    // Îmbogățim datele cu statistici calculate
    const enhancedData = {
        ...data,
        totalHours,
        totalEarnings,
        totalSessions,
        avgHourlyRate,
        monthlyHours: currentMonth.hours,
        monthlyEarnings: currentMonth.earnings,
        monthlySessions: currentMonth.sessions
    };

    // Alegem panoul în funcție de activePanel
    let panelHtml = '';
    switch (activePanel) {
        case 'overview':
            panelHtml = renderOverviewPanel(enhancedData);
            break;
        case 'users':
            panelHtml = renderUsersPanel(enhancedData);
            break;
        case 'stats':
            panelHtml = renderStatsPanel(enhancedData);
            break;
        case 'leaderboard':
            panelHtml = renderLeaderboardPanel(enhancedData);
            break;
        case 'export':
            panelHtml = renderExportPanel(enhancedData);
            break;
        default:
            panelHtml = renderOverviewPanel(enhancedData);
    }

    if (detailsContent) {
        detailsContent.innerHTML = panelHtml;
    }

    // Atașăm event listener pentru butoanele de export
    setTimeout(() => {
        document.querySelectorAll('.export-button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const format = btn.dataset.format;
                handleExport(format, enhancedData);
            });
        });
    }, 0);
}

// Funcție pentru export
function handleExport(format, data) {
    let exportContent = '';
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `export_${currentGuildName}_${timestamp}`;

    switch (format) {
        case 'table':
            exportContent = generateTableExport(data);
            downloadFile(exportContent, `${filename}.txt`, 'text/plain');
            break;
        case 'csv':
            exportContent = generateCSVExport(data);
            downloadFile(exportContent, `${filename}.csv`, 'text/csv');
            break;
        case 'json':
            exportContent = generateJSONExport(data);
            downloadFile(exportContent, `${filename}.json`, 'application/json');
            break;
    }
}

function generateTableExport(data) {
    let content = '📊 RAPORT PONTAJ - ' + currentGuildName.toUpperCase() + '\n';
    content += '='.repeat(60) + '\n\n';
    content += `Data export: ${new Date().toLocaleString('ro-RO')}\n`;
    content += `Total utilizatori: ${data.totalUsers}\n`;
    content += `Utilizatori activi: ${data.activeUsers}\n`;
    content += `Total ore: ${formatHours(data.totalHours)}\n`;
    content += `Total câștig: ${formatMoney(data.totalEarnings)}\n`;
    content += `Total sesiuni: ${data.totalSessions}\n\n`;

    content += '📋 LISTA UTILIZATORILOR\n';
    content += '-'.repeat(60) + '\n';

    data.allUsers?.forEach((user, index) => {
        content += `${index + 1}. ${user.displayName || user.username}\n`;
        content += `   ID: ${user.userId}\n`;
        content += `   CNP: ${user.displayCnp || '-'}\n`;
        content += `   Ore: ${formatHours(user.totalHours)}\n`;
        content += `   Câștig: ${formatMoney(user.totalEarnings)}\n`;
        content += `   Sesiuni: ${user.totalSessions}\n`;
        content += `   Rată orară: ${formatRate(user.hourlyRate)}\n`;
        content += `   Status: ${user.isClockedIn ? 'ACTIV' : 'INACTIV'}\n\n`;
    });

    return content;
}

function generateCSVExport(data) {
    let content = 'Nume,ID,CNP,Ore totale,Câștig total,Sesiuni,Rată orară,Status\n';

    data.allUsers?.forEach(user => {
        const name = (user.displayName || user.username).replace(/,/g, ' ');
        const cnp = user.displayCnp || '';
        content += `${name},${user.userId},${cnp},${(user.totalHours || 0).toFixed(2)},${(user.totalEarnings || 0).toFixed(2)},${user.totalSessions || 0},${(user.hourlyRate || 0).toFixed(2)},${user.isClockedIn ? 'ACTIV' : 'INACTIV'}\n`;
    });

    return content;
}

function generateJSONExport(data) {
    const exportData = {
        server: {
            id: currentGuildId,
            name: currentGuildName,
            exportDate: new Date().toISOString()
        },
        statistics: {
            totalUsers: data.totalUsers,
            activeUsers: data.activeUsers,
            totalHours: data.totalHours,
            totalEarnings: data.totalEarnings,
            totalSessions: data.totalSessions,
            avgHourlyRate: data.avgHourlyRate
        },
        users: data.allUsers?.map(u => ({
            userId: u.userId,
            username: u.username,
            displayName: u.displayName,
            cnp: u.displayCnp,
            totalHours: u.totalHours,
            totalEarnings: u.totalEarnings,
            totalSessions: u.totalSessions,
            hourlyRate: u.hourlyRate,
            isClockedIn: u.isClockedIn
        })),
        monthlyStats: data.monthlyStats,
        databaseStats: {
            totalTables: data.totalTables,
            totalRecords: data.totalRecords,
            dbSize: data.dbSize,
            lastUpdate: data.lastUpdate
        }
    };

    return JSON.stringify(exportData, null, 2);
}

function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}