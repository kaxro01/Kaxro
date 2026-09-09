const {
    REST,
    Routes
} = require("discord.js");

const fs = require("fs");
const path = require("path");

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

            if (command.data) {
                commands.push(command.data.toJSON());
            }
        }
    }
}

loadCommands(commandsPath);

const rest = new REST({
    version: "10"
}).setToken(process.env.BOT_TOKEN);

async function deploy() {
    try {
        console.log(`Deploying ${commands.length} command(s)...`);

        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            {
                body: commands
            }
        );

        console.log("All slash commands deployed successfully.");
    } catch (error) {
        console.error(error);
    }
}

deploy();
