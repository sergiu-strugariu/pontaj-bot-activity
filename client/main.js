import { initDiscordSdk, setupDiscordSdk, getAuth } from './services/discordService.js';
import { checkUserAuthorization, createCurrentUser } from './services/authService.js';
import { showLoadingScreen } from './screens/loadingScreen.js';
import { showLoginScreen } from './screens/loginScreen.js';
import { showErrorScreen } from './screens/errorScreen.js';
import { showDashboardScreen } from './screens/dashboardScreen.js'; // importă dashboard
import { appendGuildAvatar } from './components/guildAvatar.js';
import { appendVoiceChannelName } from './components/voiceChannel.js';
import { LOADING_TIMEOUT, ERROR_MESSAGES } from './utils/constants.js';

// Verifică variabilele de mediu
if (!import.meta.env.VITE_DISCORD_CLIENT_ID) {
    console.error("❌ VITE_DISCORD_CLIENT_ID is not set");
    showErrorScreen({
        title: 'Eroare de configurare',
        message: 'Client ID lipsă. Verificați fișierul .env'
    });
    throw new Error("Missing Discord Client ID");
}

// Initialize Discord SDK
console.log("🚀 Initializing Discord SDK...");
const discordSdk = initDiscordSdk(import.meta.env.VITE_DISCORD_CLIENT_ID);

// Pornește aplicația
async function startApp() {
    try {
        showLoadingScreen();

        console.log("⏳ Setting up Discord SDK...");
        await setupDiscordSdk(import.meta.env.VITE_DISCORD_CLIENT_ID);

        console.log("✅ Discord SDK is authenticated");
        const auth = getAuth();

        if (!auth || !auth.user) {
            throw new Error(ERROR_MESSAGES.NO_USER_DATA);
        }

        console.log("👤 User ID:", auth.user.id);

        await new Promise(resolve => setTimeout(resolve, LOADING_TIMEOUT));

        const userAuth = checkUserAuthorization(auth.user.id);
        const currentUser = createCurrentUser(auth.user.id, userAuth);

        if (userAuth) {
            const discordUsername = auth.user.username; // sau auth.user.global_name
            // Afișează login screen și pasează callback pentru buton
            showLoginScreen(userAuth, currentUser, discordUsername, () => {
                // Când se face click pe buton, afișează dashboard
                showDashboardScreen(userAuth, currentUser, discordUsername);
            });

            // Afișăm informațiile suplimentare (opțional, poate vrei să le muți în dashboard)
            // appendVoiceChannelName();
            // appendGuildAvatar();
        } else {
            console.log("❌ User not authorized:", auth.user.id);
            showErrorScreen({
                message: ERROR_MESSAGES.UNAUTHORIZED,
                title: 'Acces interzis!'
            }, currentUser);
        }

    } catch (error) {
        console.error("❌ Application error:", error);
        let errorMessage = error.message || ERROR_MESSAGES.UNKNOWN;
        if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
            errorMessage = ERROR_MESSAGES.NETWORK_ERROR;
        } else if (errorMessage.includes('authenticate')) {
            errorMessage = ERROR_MESSAGES.AUTH_FAILED;
        }
        showErrorScreen({
            title: 'Eroare de sistem',
            message: errorMessage
        });
    }
}

// Handler erori globale
window.addEventListener('unhandledrejection', (event) => {
    console.error('❌ Unhandled rejection:', event.reason);
    showErrorScreen({
        title: 'Eroare neașteptată',
        message: ERROR_MESSAGES.UNKNOWN
    });
});

startApp();