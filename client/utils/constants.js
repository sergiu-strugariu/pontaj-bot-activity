export const DISCORD_SCOPES = [
    "identify",
    "guilds",
    "guilds.members.read",
    "applications.commands"
];

export const LOADING_TIMEOUT = 2000; // 2 seconds - mai rapid pentru experiență mai bună

export const DISCORD_API = {
    BASE_URL: 'https://discord.com/api/v10',
    CDN_URL: 'https://cdn.discordapp.com'
};

export const ERROR_MESSAGES = {
    AUTH_FAILED: 'Autentificarea a eșuat. Vă rugăm să încercați din nou.',
    NO_USER_DATA: 'Nu s-au putut obține datele utilizatorului.',
    UNAUTHORIZED: 'Nu aveți permisiunea de a accesa această aplicație.',
    NETWORK_ERROR: 'Eroare de conexiune. Verificați rețeaua și încercați din nou.',
    UNKNOWN: 'A apărut o eroare necunoscută.'
};