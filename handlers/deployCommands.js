const { REST, Routes } = require("discord.js");
const fs = require("fs");
const path = require("path");

async function deployCommands() {
    const commands = [];
    const commandsPath = path.join(__dirname, "..", "commands");

    function readCommands(directory) {
        const files = fs.readdirSync(directory);

        for (const file of files) {
            const filePath = path.join(directory, file);
            const stat = fs.statSync(filePath);

            if (stat.isDirectory()) {
                readCommands(filePath);
            } else if (file.endsWith(".js")) {
                const command = require(filePath);

                if (command.data) {
                    commands.push(command.data.toJSON());
                }
            }
        }
    }

    readCommands(commandsPath);

    const rest = new REST({ version: "10" })
        .setToken(process.env.BOT_TOKEN);

    await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: commands }
    );

    console.log(`Deployed ${commands.length} command(s).`);
}

module.exports = { deployCommands };
