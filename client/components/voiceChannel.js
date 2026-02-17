import { getDiscordSdk } from '../services/discordService.js';

export async function appendVoiceChannelName() {
    const app = document.querySelector('#app');
    const discordSdk = getDiscordSdk();

    let activityChannelName = 'Unknown';

    if (discordSdk.channelId != null && discordSdk.guildId != null) {
        const channel = await discordSdk.commands.getChannel({channel_id: discordSdk.channelId});
        if (channel.name != null) {
            activityChannelName = channel.name;
        }
    }

    const textTagString = `Activity Channel: "${activityChannelName}"`;
    const textTag = document.createElement('p');
    textTag.textContent = textTagString;
    app.appendChild(textTag);
}