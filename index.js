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

if (fs.existsSync(commandsPath)) {
    const commandFiles = fs
        .readdirSync(commandsPath)
        .filter(file => file.endsWith(".js"));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);

        if ("data" in command && "execute" in command) {
            client.commands.set(
                command.data.name,
                command
            );

            console.log(`Loaded command: /${command.data.name}`);
        }
    }
}

client.once("ready", () => {
    console.log("--------------------------------");
    console.log(`KaXro is online as ${client.user.tag}`);
    console.log(`Commands loaded: ${client.commands.size}`);
    console.log("--------------------------------");
});

client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(
        interaction.commandName
    );

    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(
            `Error running /${interaction.commandName}:`,
            error
        );

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

if (!process.env.BOT_TOKEN) {
    console.error("BOT_TOKEN is missing!");
    process.exit(1);
}

client.login(process.env.BOT_TOKEN);
