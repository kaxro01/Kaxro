const {
    Client,
    GatewayIntentBits,
    Collection,
    REST,
    Routes,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    MessageFlags
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers
    ]
});

client.commands = new Collection();


// ========================================
// LOAD COMMANDS
// ========================================

const commandsPath = path.join(__dirname, "commands");

if (!fs.existsSync(commandsPath)) {
    console.error("commands folder not found.");
    process.exit(1);
}

for (const file of fs.readdirSync(commandsPath)) {
    if (!file.endsWith(".js")) continue;

    try {
        const command = require(path.join(commandsPath, file));

        if (command.data && command.execute) {
            client.commands.set(command.data.name, command);
            console.log(`Loaded command: ${command.data.name}`);
        }
    } catch (error) {
        console.error(`Failed to load ${file}:`, error);
    }
}


// ========================================
// READY
// ========================================

client.once("clientReady", async () => {
    console.log(`KaXro is online as ${client.user.tag}`);

    try {
        const rest = new REST({
            version: "10"
        }).setToken(process.env.BOT_TOKEN);

        await rest.put(
            Routes.applicationGuildCommands(
                process.env.CLIENT_ID,
                process.env.GUILD_ID
            ),
            {
                body: [...client.commands.values()].map(command =>
                    command.data.toJSON()
                )
            }
        );

        console.log("Slash commands deployed.");
    } catch (error) {
        console.error("Command deployment failed:", error);
    }
});


// ========================================
// RESOLVE MEMBER
// ========================================

async function resolveMember(guild, input) {
    if (!input) return null;

    let value = input.trim();

    // <@123>
    // <@!123>
    const mention = value.match(/^<@!?(\d+)>$/);

    if (mention) {
        value = mention[1];
    }

    // Discord ID
    if (/^\d+$/.test(value)) {
        try {
            return await guild.members.fetch(value);
        } catch {
            return null;
        }
    }

    // @username
    value = value.replace(/^@/, "").trim();

    // Cached member
    const cached = guild.members.cache.find(member =>
        member.user.username.toLowerCase() === value.toLowerCase() ||
        member.displayName.toLowerCase() === value.toLowerCase()
    );

    if (cached) {
        return cached;
    }

    // Server member search
    try {
        const members = await guild.members.fetch({
            query: value,
            limit: 10
        });

        return members.find(member =>
            member.user.username.toLowerCase() === value.toLowerCase() ||
            member.displayName.toLowerCase() === value.toLowerCase()
        ) || null;
    } catch {
        return null;
    }
}


// ========================================
// INTERACTION HANDLER
// ========================================

client.on("interactionCreate", async interaction => {

    try {

        // ==================================
        // SLASH COMMAND
        // ==================================

        if (interaction.isChatInputCommand()) {

            const command = client.commands.get(
                interaction.commandName
            );

            if (!command) return;

            await command.execute(interaction);

            return;
        }


        // ==================================
        // START CROSS TRADE
        // ==================================

        if (
            interaction.isButton() &&
            interaction.customId === "mm_start"
        ) {

            // Show modal immediately.
            // Do NOT perform database/member work here.
            const modal = new ModalBuilder()
                .setCustomId("cross_trade")
                .setTitle("Cross Trade");


            const user1 = new TextInputBuilder()
                .setCustomId("user1")
                .setLabel("User 1")
                .setPlaceholder("@username or User ID")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);


            const user2 = new TextInputBuilder()
                .setCustomId("user2")
                .setLabel("User 2")
                .setPlaceholder("@username or User ID")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);


            const giving1 = new TextInputBuilder()
                .setCustomId("giving1")
                .setLabel("What is User 1 giving?")
                .setPlaceholder("Example: Headless Horseman")
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);


            const giving2 = new TextInputBuilder()
                .setCustomId("giving2")
                .setLabel("What is User 2 giving?")
                .setPlaceholder("Example: 20,000 Robux")
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);


            modal.addComponents(
                new ActionRowBuilder().addComponents(user1),
                new ActionRowBuilder().addComponents(user2),
                new ActionRowBuilder().addComponents(giving1),
                new ActionRowBuilder().addComponents(giving2)
            );


            await interaction.showModal(modal);

            return;
        }


        // ==================================
        // CROSS TRADE FORM
        // ==================================

        if (
            interaction.isModalSubmit() &&
            interaction.customId === "cross_trade"
        ) {

            // IMPORTANT:
            // Acknowledge immediately so Discord
            // doesn't show "didn't respond in time".
            await interaction.deferReply({
                flags: MessageFlags.Ephemeral
            });


            const user1Input =
                interaction.fields.getTextInputValue("user1");

            const user2Input =
                interaction.fields.getTextInputValue("user2");

            const giving1 =
                interaction.fields.getTextInputValue("giving1");

            const giving2 =
                interaction.fields.getTextInputValue("giving2");


            // Resolve members after acknowledgement.
            const user1 = await resolveMember(
                interaction.guild,
                user1Input
            );

            const user2 = await resolveMember(
                interaction.guild,
                user2Input
            );


            // ==================================
            // USER 1 NOT FOUND
            // ==================================

            if (!user1) {
                await interaction.editReply({
                    content: "User 1 is not in this server."
                });

                return;
            }


            // ==================================
            // USER 2 NOT FOUND
            // ==================================

            if (!user2) {
                await interaction.editReply({
                    content: "Member not in server."
                });

                return;
            }


            // ==================================
            // SUCCESS
            // ==================================

            await interaction.editReply({
                content:
                    `User 1: <@${user1.id}>\n` +
                    `User 2: <@${user2.id}>\n\n` +
                    `User 1 giving: ${giving1}\n` +
                    `User 2 giving: ${giving2}`
            });

            return;
        }

    } catch (error) {

        console.error("Interaction error:", error);

        try {

            if (interaction.deferred) {

                await interaction.editReply({
                    content: "Something went wrong. Please try again."
                });

            } else if (interaction.replied) {

                await interaction.followUp({
                    content: "Something went wrong. Please try again.",
                    flags: MessageFlags.Ephemeral
                });

            } else {

                await interaction.reply({
                    content: "Something went wrong. Please try again.",
                    flags: MessageFlags.Ephemeral
                });

            }

        } catch (replyError) {
            console.error(
                "Failed to send error response:",
                replyError
            );
        }
    }
});


// ========================================
// LOGIN
// ========================================

if (!process.env.BOT_TOKEN) {
    console.error("BOT_TOKEN is missing.");
    process.exit(1);
}

client.login(process.env.BOT_TOKEN);
