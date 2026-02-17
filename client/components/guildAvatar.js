import { getAuth, getDiscordSdk } from '../services/discordService.js';
import { DISCORD_API } from '../utils/constants.js';

export async function appendGuildAvatar() {
    const app = document.querySelector('#app');
    const auth = getAuth();
    const discordSdk = getDiscordSdk();

    if (!auth || !discordSdk) return;

    // Fetch all of the user's guilds
    const guilds = await fetch(`${DISCORD_API.BASE_URL}/users/@me/guilds`, {
        headers: {
            Authorization: `Bearer ${auth.access_token}`,
            'Content-Type': 'application/json',
        },
    }).then((response) => response.json());

    // Find the current guild's info
    const currentGuild = guilds.find((g) => g.id === discordSdk.guildId);

    // Append to the UI
    if (currentGuild != null) {
        const guildImg = document.createElement('img');
        guildImg.setAttribute(
            'src',
            `${DISCORD_API.CDN_URL}/icons/${currentGuild.id}/${currentGuild.icon}.webp?size=128`
        );
        guildImg.setAttribute('width', '128px');
        guildImg.setAttribute('height', '128px');
        guildImg.setAttribute('style', 'border-radius: 50%;');
        app.appendChild(guildImg);
    }
}