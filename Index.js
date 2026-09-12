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
        GatewayIntentBits.Guilds
    ]
});

client.commands = new Collection();


// ===============================
// LOAD COMMANDS
// ===============================

const commandPath = path.join(__dirname, "commands");

for (const file of fs.readdirSync(commandPath)) {
    if (!file.endsWith(".js")) continue;

    const command = require(path.join(commandPath, file));

    if (command.data && command.execute) {
        client.commands.set(command.data.name, command);
        console.log("Loaded command:", command.data.name);
    }
}


// ===============================
// RESOLVE DISCORD MEMBER
// ===============================

async function resolveMember(guild, input) {
    if (!input) return null;

    let value = input.trim();

    // Remove <@123456789>
    // Remove <@!123456789>
    const mentionMatch = value.match(/^<@!?(\d+)>$/);

    if (mentionMatch) {
        value = mentionMatch[1];
    }

    // Raw Discord ID
    if (/^\d+$/.test(value)) {
        try {
            return await guild.members.fetch(value);
        } catch {
            return null;
        }
    }

    // Remove @ from normal username
    value = value.replace(/^@/, "").trim();

    // Check cached members first
    const cached = guild.members.cache.find(member =>
        member.user.username.toLowerCase() === value.toLowerCase() ||
        member.displayName.toLowerCase() === value.toLowerCase()
    );

    if (cached) {
        return cached;
    }

    // Search server members
    try {
        const results = await guild.members.fetch({
            query: value,
            limit: 10
        });

        const exact = results.find(member =>
            member.user.username.toLowerCase() === value.toLowerCase() ||
            member.displayName.toLowerCase() === value.toLowerCase()
        );

        return exact || null;
    } catch {
        return null;
    }
}


// ===============================
// READY
// ===============================

client.once("clientReady", async () => {
    console.log("KaXro is online as", client.user.tag);

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
        console.error("Command deployment error:", error);
    }
});


// ===============================
// INTERACTIONS
// ===============================

client.on("interactionCreate", async interaction => {

    // ===========================
    // SLASH COMMANDS
    // ===========================

    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(
            interaction.commandName
        );

        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);

            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: "Something went wrong while running this command.",
                    flags: MessageFlags.Ephemeral
                });
            }
        }

        return;
    }


    // ===========================
    // START CROSS TRADE
    // ===========================

    if (
        interaction.isButton() &&
        interaction.customId === "mm_start"
    ) {

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


    // ===========================
    // CROSS TRADE SUBMISSION
    // ===========================

    if (
        interaction.isModalSubmit() &&
        interaction.customId === "cross_trade"
    ) {

        const user1Input =
            interaction.fields.getTextInputValue("user1");

        const user2Input =
            interaction.fields.getTextInputValue("user2");

        const giving1 =
            interaction.fields.getTextInputValue("giving1");

        const giving2 =
            interaction.fields.getTextInputValue("giving2");


        // Resolve both users
        const user1 = await resolveMember(
            interaction.guild,
            user1Input
        );

        const user2 = await resolveMember(
            interaction.guild,
            user2Input
        );


        // User 1 not found
        if (!user1) {
            await interaction.reply({
                content: "User 1 is not in this server.",
                flags: MessageFlags.Ephemeral
            });

            return;
        }


        // User 2 not found
        if (!user2) {
            await interaction.reply({
                content: "Member not in server.",
                flags: MessageFlags.Ephemeral
            });

            return;
        }


        // ===========================
        // FINAL RESULT
        // ===========================

        await interaction.reply({
            content:
                `User 1: <@${user1.id}>\n` +
                `User 2: <@${user2.id}>\n` +
                `User 1 giving: ${giving1}\n` +
                `User 2 giving: ${giving2}`,
            flags: MessageFlags.Ephemeral
        });

        return;
    }
});


// ===============================
// LOGIN
// ===============================

client.login(process.env.BOT_TOKEN);
