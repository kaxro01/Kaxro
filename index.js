const {
    Client,
    GatewayIntentBits,
    Collection
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds
    ]
});

client.commands = new Collection();

// Load commands
const commandsPath = path.join(__dirname, "commands");

if (fs.existsSync(commandsPath)) {
    const commandFiles = fs
        .readdirSync(commandsPath)
        .filter(file => file.endsWith(".js"));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);

        if ("data" in command && "execute" in command) {
            client.commands.set(command.data.name, command);
            console.log(`Loaded command: ${command.data.name}`);
        }
    }
}

// Load interaction handler
const interactionHandler = require("./handlers/interactionHandler");

// Bot ready
client.once("ready", () => {
    console.log(`KaXro is online as ${client.user.tag}`);
});

// Handle commands and buttons
client.on("interactionCreate", async interaction => {

    // Slash commands
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);

        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({
                    content: "Something went wrong while running this command.",
                    ephemeral: true
                });
            } else {
                await interaction.reply({
                    content: "Something went wrong while running this command.",
                    ephemeral: true
                });
            }
        }

        return;
    }

    // Buttons
    if (interaction.isButton()) {
        try {
            await interactionHandler(interaction);
        } catch (error) {
            console.error(error);

            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: "Something went wrong.",
                    ephemeral: true
                });
            }
        }
    }
});

// Login
client.login(process.env.BOT_TOKEN);
