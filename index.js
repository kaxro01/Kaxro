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
const commandsPath = path.join(__dirname, "commands");

function loadCommands(directory) {
    const files = fs.readdirSync(directory);

    for (const file of files) {
        const filePath = path.join(directory, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            loadCommands(filePath);
        } else if (file.endsWith(".js")) {
            const command = require(filePath);

            if (command.data && command.execute) {
                client.commands.set(command.data.name, command);
                commands.push(command.data.toJSON());
            }
        }
    }
}

loadCommands(commandsPath);

client.once("ready", async () => {
    console.log(`KaXro is online as ${client.user.tag}`);
    console.log(`Loaded ${client.commands.size} command(s).`);

    try {
        const rest = new REST({ version: "10" })
            .setToken(process.env.BOT_TOKEN);

        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        );

        console.log("Slash commands deployed successfully.");
    } catch (error) {
        console.error("Failed to deploy commands:", error);
    }
});

client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);

        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
                content: "Something went wrong.",
                ephemeral: true
            });
        } else {
            await interaction.reply({
                content: "Something went wrong.",
                ephemeral: true
            });
        }
    }
});

client.login(process.env.BOT_TOKEN);
