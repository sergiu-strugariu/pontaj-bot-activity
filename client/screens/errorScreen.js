import './errorScreen.css';
import rocketLogo from '/logo.png';

export function showErrorScreen(error, currentUser = null) {
    const app = document.querySelector('#app');

    if (!app) {
        console.error('❌ #app element not found');
        return;
    }

    const errorMessage = error.message || error || 'Eroare necunoscută';
    const errorTitle = error.title || 'Eroare de sistem';
    const errorCode = error.code || 'ERR_' + Math.floor(Math.random() * 1000);
    const userId = currentUser?.id || 'neautentificat';

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
        <div class="error-wrapper">
            <div class="error-frame">
                <!-- Header -->
                <div class="error-header">
                    <img src="${rocketLogo}" class="institution-logo" alt="Stema Instituției" />
                    <h1>MINISTERUL AFACERILOR INTERNE</h1>
                    <h2>Inspectoratul Teritorial de Muncă</h2>
                    <div class="error-tag">Eroare de sistem</div>
                </div>

                <!-- Main content -->
                <div class="main-content">
                    <div class="error-card">
                        <div class="error-title">${errorTitle}</div>
                        <div class="error-message">${errorMessage}</div>
                        
                        <div class="error-details">
                            <div class="detail-row">
                                <span class="detail-label">Cod eroare</span>
                                <span class="detail-value">${errorCode}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">ID utilizator</span>
                                <span class="detail-value">${userId}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Data</span>
                                <span class="detail-value">${formattedDate}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Ora</span>
                                <span class="detail-value">${formattedTime}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Footer -->
                <div class="error-footer">
                    <div class="official-warning">
                        <div class="warning-title">Avertisment</div>
                        <div class="warning-text">
                            Dacă problema persistă, contactați departamentul IT. 
                            Toate erorile sunt înregistrate automat.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}