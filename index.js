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

const commandsPath = path.join(__dirname, "commands");

function loadCommands(directory) {
    if (!fs.existsSync(directory)) return;

    const files = fs.readdirSync(directory);

    for (const file of files) {
        const filePath = path.join(directory, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            loadCommands(filePath);
        } else if (file.endsWith(".js")) {
            try {
                const command = require(filePath);

                if (command.data && command.execute) {
                    client.commands.set(
                        command.data.name,
                        command
                    );

                    console.log(`Loaded command: /${command.data.name}`);
                }
            } catch (error) {
                console.error(`Failed to load ${file}:`, error);
            }
        }
    }
}

loadCommands(commandsPath);

client.once("ready", () => {
    console.log("--------------------------------");
    console.log(`KaXro is online as ${client.user.tag}`);
    console.log(`Commands loaded: ${client.commands.size}`);
    console.log(`Server: ${process.env.GUILD_ID}`);
    console.log("--------------------------------");
});

client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) {
        console.log(`Unknown command: ${interaction.commandName}`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(
            `Error while running /${interaction.commandName}:`,
            error
        );

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
});

client.login(process.env.BOT_TOKEN);
