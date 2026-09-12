const {
    Client,
    GatewayIntentBits,
    Collection,
    REST,
    Routes
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds
    ]
});

client.commands = new Collection();

const commands = [];

// Load commands
const commandsPath = path.join(__dirname, "commands");

if (fs.existsSync(commandsPath)) {
    const commandFiles = fs
        .readdirSync(commandsPath)
        .filter(file => file.endsWith(".js"));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);

        if (command.data && command.execute) {
            client.commands.set(command.data.name, command);
            commands.push(command.data.toJSON());

            console.log(`Loaded command: ${command.data.name}`);
        }
    }
}

// Load interaction handler
const interactionHandler = require("./handlers/interactionHandler");

// Deploy slash commands
async function deployCommands() {
    try {
        if (!process.env.BOT_TOKEN) {
            throw new Error("BOT_TOKEN is missing.");
        }

        if (!process.env.CLIENT_ID) {
            throw new Error("CLIENT_ID is missing.");
        }

        if (!process.env.GUILD_ID) {
            throw new Error("GUILD_ID is missing.");
        }

        const rest = new REST({ version: "10" })
            .setToken(process.env.BOT_TOKEN);

        console.log(`Deploying ${commands.length} command(s)...`);

        await rest.put(
            Routes.applicationGuildCommands(
                process.env.CLIENT_ID,
                process.env.GUILD_ID
            ),
            {
                body: commands
            }
        );

        console.log("All slash commands deployed successfully.");
    } catch (error) {
        console.error("Command deployment error:", error);
    }
}

// Bot ready
client.once("clientReady", async () => {
    console.log(`KaXro is online as ${client.user.tag}`);

    await deployCommands();
});

// Handle interactions
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
