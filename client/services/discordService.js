import { DiscordSDK } from "@discord/embedded-app-sdk";

let discordSdk = null;
let auth = null;

export function initDiscordSdk(clientId) {
    discordSdk = new DiscordSDK(clientId);
    return discordSdk;
}

export function getDiscordSdk() {
    return discordSdk;
}

export function setAuth(authData) {
    auth = authData;
}

export function getAuth() {
    return auth;
}

export async function setupDiscordSdk(clientId) {
    try {
        if (!discordSdk) {
            discordSdk = initDiscordSdk(clientId);
        }

        await discordSdk.ready();
        console.log("✅ Discord SDK is ready");

        // Authorize with Discord Client
        const { code } = await discordSdk.commands.authorize({
            client_id: clientId,
            response_type: "code",
            state: "",
            prompt: "none",
            scope: [
                "identify",
                // "guilds",
                // "guilds.members.read",
                // "applications.commands"
            ],
        });

        if (!code) {
            throw new Error("No authorization code received");
        }

        // Retrieve an access_token from your activity's server
        const response = await fetch("/api/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ code }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error_description || "Failed to get access token");
        }

        const { access_token } = await response.json();

        if (!access_token) {
            throw new Error("No access token received");
        }

        // Authenticate with Discord client
        auth = await discordSdk.commands.authenticate({
            access_token,
        });

        if (!auth || !auth.user) {
            throw new Error("Authentication failed - no user data");
        }

        console.log("✅ Authenticated as:", auth.user.username);
        return true;

    } catch (error) {
        console.error("❌ Setup failed:", error);
        throw error;
    }
}