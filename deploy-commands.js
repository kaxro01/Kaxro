const {
    REST,
    Routes
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const commands = [];

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
                    commands.push(command.data.toJSON());
                }
            } catch (error) {
                console.error(`Failed to load ${file}:`, error);
            }
        }
    }
}

loadCommands(commandsPath);

if (!process.env.BOT_TOKEN) {
    console.error("BOT_TOKEN is missing.");
    process.exit(1);
}

if (!process.env.CLIENT_ID) {
    console.error("CLIENT_ID is missing.");
    process.exit(1);
}

if (!process.env.GUILD_ID) {
    console.error("GUILD_ID is missing.");
    process.exit(1);
}

const rest = new REST({ version: "10" })
    .setToken(process.env.BOT_TOKEN);

async function deployCommands() {
    try {
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
        console.log(`Guild ID: ${process.env.GUILD_ID}`);
    } catch (error) {
        console.error("Failed to deploy slash commands:");
        console.error(error);
    }
}

deployCommands();
