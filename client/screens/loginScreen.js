import './loginScreen.css';
import rocketLogo from '/logo.png';

export function showLoginScreen(userData, currentUser, discordUsername, onAccessClick) {
    const app = document.querySelector('#app');

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
        <div class="login-wrapper">
            <div class="login-frame">
                <!-- Header -->
                <div class="login-header">
                    <img src="${rocketLogo}" class="institution-logo" alt="Stema Instituției" />
                    <h1>Inspecța Muncii</h1>
                    <h2>Inspectoratul Teritorial de Muncă</h2>
                    <div class="security-tag">Sistem informatic securizat • Nivel clasificat</div>
                </div>

                <!-- Security badges row -->
                <div class="security-badges">
                    <div class="badge-item">2FA activ</div>
                    <div class="badge-item">Certificat valid</div>
                    <div class="badge-item">TLS 1.3</div>
                </div>

                <!-- Main content - user info -->
                <div class="main-content">
                    <div class="user-info-card">
                        <div class="info-row">
                            <div class="info-label">Utilizator autentificat</div>
                            <div class="info-value">
                                ${discordUsername}
                                <span class="role-badge">${userData.role}</span>
                            </div>
                        </div>
                        <div class="info-row">
                            <div class="info-label">Departament</div>
                            <div class="info-value">Direcția Generală de Inspecție</div>
                        </div>
                        <div class="info-row">
                            <div class="info-label">Cod identificare unic</div>
                            <div class="id-container">
                                <span class="id-label">ID</span>
                                <span class="id-value">${currentUser.id}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Footer -->
                <div class="login-footer">
                    <div class="timestamp">
                        <span>${formattedDate}</span>
                        <span>${formattedTime}</span>
                    </div>

                    <button id="access-button" class="login-button">
                        Accesează panou oficial
                    </button>

                    <div class="official-warning">
                        <div class="warning-title">Avertisment</div>
                        <div class="warning-text">
                            Accesul neautorizat este interzis prin lege. Toate acțiunile sunt monitorizate și înregistrate conform OG 77/2026.
                        </div>
                    </div>

                    <div class="security-strip">
                        <span class="strip-item">Conexiune securizată</span>
                        <span class="strip-item">Sistem guvernamental</span>
                        <span class="strip-item">GDPR compliant</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Atașează event listener după ce elementul există
    setTimeout(() => {
        const btn = document.getElementById('access-button');
        if (btn) {
            btn.addEventListener('click', onAccessClick);
        }
    }, 0);
}