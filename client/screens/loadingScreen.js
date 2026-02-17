import './loadingScreen.css';
import rocketLogo from '/logo.png';

export function showLoadingScreen() {
    const app = document.querySelector('#app');

    const now = new Date();
    const dateStr = now.toLocaleDateString('ro-RO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const timeStr = now.toLocaleTimeString('ro-RO', {
        hour: '2-digit',
        minute: '2-digit'
    });

    const sessionId = Math.random().toString(36).substring(2, 10).toUpperCase();
    const referenceId = Math.random().toString(36).substring(2, 8).toUpperCase();

    app.innerHTML = `
        <div class="loading-wrapper">
            <div class="loading-frame">
                <div class="loading-header">
                    <img src="${rocketLogo}" class="institution-logo" alt="Instituție" />
                    <h1>Ministerul Afacerilor Interne</h1>
                    <h2>Inspectoratul Teritorial de Muncă</h2>
                    <div class="security-badge">Confidențial</div> 
                </div> 
                
                <div class="main-content">
                    <div class="processing-card">
                        <div class="spinner-section">
                            <div class="loading-spinner"></div>
                            
                            <div class="status-container">
                                <div class="status-title">Verificare identitate digitală</div>
                                <div class="status-description">Se validează credențialele în sistemul național</div>
                                
                                <div class="processing-hint">
                                    ID utilizator: se procesează...
                                </div>
                            </div>
                        </div>
                        
                        <div class="security-metrics">
                            <div class="metric-item">
                                <div class="metric-label">Conexiune</div>
                                <div class="metric-value secure">TLS 1.3</div>
                            </div>
                            <div class="metric-item">
                                <div class="metric-label">Certificat</div>
                                <div class="metric-value encrypted">Valid</div>
                            </div>
                            <div class="metric-item">
                                <div class="metric-label">Sesiune</div>
                                <div class="metric-value">${sessionId}</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="loading-footer">
                    <div class="session-info">
                        <div class="info-item">
                            <span>${dateStr}</span>
                        </div>
                        <div class="info-item">
                            <span>${timeStr}</span>
                        </div>
                        <div class="info-item">
                            <span>Ref: ${referenceId}</span>
                        </div>
                    </div>
                    
                    <div class="official-notice"> 
                        <div class="notice-title">Avertisment</div>
                        <div class="notice-text">
                            Acces monitorizat conform Legii nr. 123/2023. 
                            Tentativele de acces neautorizat sunt înregistrate.
                        </div>
                    </div>
                    
                    <div class="certificate-strip">
                        <span class="cert-item">ITM-CA 2026</span>
                        <span class="cert-item">Autentificare securizată</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}