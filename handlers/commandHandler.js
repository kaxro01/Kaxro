const fs = require("fs");
const path = require("path");

function loadCommands(client) {
    client.commands = new Map();

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

                if (command.data && command.execute) {
                    client.commands.set(
                        command.data.name,
                        command
                    );
                }
            }
        }
    }

    readCommands(commandsPath);

    console.log(`Loaded ${client.commands.size} command(s).`);
}

module.exports = { loadCommands };
