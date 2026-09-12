const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers
    ]
});

// ==================================================
// COMMAND LOADER
// ==================================================

const commands = new Map();
const commandsPath = path.join(__dirname, "commands");

if (fs.existsSync(commandsPath)) {
    const files = fs.readdirSync(commandsPath)
        .filter(file => file.endsWith(".js"));

    for (const file of files) {
        const command = require(path.join(commandsPath, file));

        if (command.data && command.execute) {
            commands.set(command.data.name, command);
            console.log(`Loaded command: ${command.data.name}`);
        }
    }
}

// ==================================================
// DATABASE
// ==================================================

const dataFolder = path.join(__dirname, "data");
const dataFile = path.join(dataFolder, "mmRequests.json");

if (!fs.existsSync(dataFolder)) {
    fs.mkdirSync(dataFolder, {
        recursive: true
    });
}

if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, "[]");
}

function loadRequests() {
    try {
        return JSON.parse(
            fs.readFileSync(dataFile, "utf8")
        );
    } catch {
        return [];
    }
}

function saveRequests(requests) {
    fs.writeFileSync(
        dataFile,
        JSON.stringify(requests, null, 2)
    );
}

// ==================================================
// HOME PAGE
// ==================================================

function homePage() {
    const embed = new EmbedBuilder()
        .setColor("#00BFFF")
        .setTitle("KA7X Middleman")
        .setDescription(
            "Welcome to the KA7X Middleman system.\n\n" +
            "Start a new middleman request or check the status of your previous requests."
        );

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId("mm_start")
                .setLabel("Start MM")
                .setStyle(ButtonStyle.Primary),

            new ButtonBuilder()
                .setCustomId("mm_requests")
                .setLabel("My Requests")
                .setStyle(ButtonStyle.Secondary)
        );

    const row2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId("mm_info")
                .setLabel("MM Info")
                .setStyle(ButtonStyle.Secondary),

            new ButtonBuilder()
                .setCustomId("mm_rules")
                .setLabel("MM Rules")
                .setStyle(ButtonStyle.Secondary)
        );

    return {
        embeds: [embed],
        components: [row, row2]
    };
}

// ==================================================
// BUTTON HANDLER
// ==================================================

client.on("interactionCreate", async interaction => {

    try {

        // ==================================================
        // SLASH COMMANDS
        // ==================================================

        if (interaction.isChatInputCommand()) {

            const command = commands.get(
                interaction.commandName
            );

            if (!command) return;

            await command.execute(interaction);
            return;
        }

        // ==================================================
        // BUTTONS
        // ==================================================

        if (interaction.isButton()) {

            // ==================================================
            // HOME
            // ==================================================

            if (interaction.customId === "mm_home") {

                return interaction.update(
                    homePage()
                );
            }

            // ==================================================
            // START MM
            // ==================================================

            if (interaction.customId === "mm_start") {

                const roleId = process.env.MM_ROLE_ID;

                if (!roleId) {
                    return interaction.update({
                        content: "MM_ROLE_ID is not configured.",
                        embeds: [],
                        components: []
                    });
                }

                await interaction.guild.members.fetch();

                const mmMembers = interaction.guild.members.cache
                    .filter(member =>
                        !member.user.bot &&
                        member.roles.cache.has(roleId)
                    )
                    .first(25);

                if (mmMembers.length === 0) {

                    return interaction.update({
                        content:
                            "There are currently no MM Staff members available.",
                        embeds: [],
                        components: [
                            new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId("mm_home")
                                        .setLabel("Back")
                                        .setStyle(ButtonStyle.Secondary)
                                )
                        ]
                    });
                }

                const options = mmMembers.map(member => ({
                    label: member.displayName.slice(0, 100),
                    description: `@${member.user.username}`.slice(0, 100),
                    value: member.id
                }));

                const select = new StringSelectMenuBuilder()
                    .setCustomId("mm_select_staff")
                    .setPlaceholder("Choose a Middleman")
                    .addOptions(options);

                const row = new ActionRowBuilder()
                    .addComponents(select);

                const back = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId("mm_home")
                            .setLabel("Back")
                            .setStyle(ButtonStyle.Secondary)
                    );

                const embed = new EmbedBuilder()
                    .setColor("#00BFFF")
                    .setTitle("Choose a Middleman")
                    .setDescription(
                        "Select the MM Staff member you want to handle this Cross Trade."
                    );

                return interaction.update({
                    embeds: [embed],
                    components: [row, back]
                });
            }

            // ==================================================
            // MY REQUESTS
            // ==================================================

            if (interaction.customId === "mm_requests") {

                const requests = loadRequests();

                const userRequests = requests
                    .filter(request =>
                        request.guildId === interaction.guild.id &&
                        (
                            request.user1 === interaction.user.id ||
                            request.user2 === interaction.user.id ||
                            request.middleman === interaction.user.id
                        )
                    )
                    .sort(
                        (a, b) =>
                            new Date(b.createdAt) -
                            new Date(a.createdAt)
                    );

                if (userRequests.length === 0) {

                    const embed = new EmbedBuilder()
                        .setColor("#00BFFF")
                        .setTitle("My Requests")
                        .setDescription(
                            "You don't have any middleman requests."
                        );

                    const row = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId("mm_home")
                                .setLabel("Back")
                                .setStyle(ButtonStyle.Secondary)
                        );

                    return interaction.update({
                        embeds: [embed],
                        components: [row]
                    });
                }

                let description = "";

                for (const request of userRequests.slice(0, 10)) {

                    const status =
                        request.status.charAt(0).toUpperCase() +
                        request.status.slice(1);

                    description +=
                        `**MM #${request.id}**\n` +
                        `User 1: <@${request.user1}>\n` +
                        `User 2: <@${request.user2}>\n` +
                        `Middleman: <@${request.middleman}>\n` +
                        `Status: **${status}**\n\n`;
                }

                const embed = new EmbedBuilder()
                    .setColor("#00BFFF")
                    .setTitle("My Requests")
                    .setDescription(description);

                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId("mm_home")
                            .setLabel("Back")
                            .setStyle(ButtonStyle.Secondary)
                    );

                return interaction.update({
                    embeds: [embed],
                    components: [row]
                });
            }

            // ==================================================
            // INFO
            // ==================================================

            if (interaction.customId === "mm_info") {

                const embed = new EmbedBuilder()
                    .setColor("#00BFFF")
                    .setTitle("MM Info")
                    .setDescription(
                        "KA7X Middleman helps users complete Cross Trades through an assigned MM Staff member."
                    );

                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId("mm_home")
                            .setLabel("Back")
                            .setStyle(ButtonStyle.Secondary)
                    );

                return interaction.update({
                    embeds: [embed],
                    components: [row]
                });
            }

            // ==================================================
            // RULES
            // ==================================================

            if (interaction.customId === "mm_rules") {

                const embed = new EmbedBuilder()
                    .setColor("#00BFFF")
                    .setTitle("MM Rules")
                    .setDescription(
                        "1. Only use the official KA7X MM system.\n" +
                        "2. Follow your assigned MM's instructions.\n" +
                        "3. Do not fake proof or information.\n" +
                        "4. Do not rush the Middleman.\n" +
                        "5. Report suspicious activity to staff."
                    );

                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId("mm_home")
                            .setLabel("Back")
                            .setStyle(ButtonStyle.Secondary)
                    );

                return interaction.update({
                    embeds: [embed],
                    components: [row]
                });
            }

            // ==================================================
            // ACCEPT
            // ==================================================

            if (interaction.customId.startsWith("mm_accept_")) {

                const id = interaction.customId.replace(
                    "mm_accept_",
                    ""
                );

                const requests = loadRequests();

                const request = requests.find(
                    r => String(r.id) === String(id)
                );

                if (!request) {
                    return interaction.reply({
                        content: "This request no longer exists.",
                        ephemeral: true
                    });
                }

                if (interaction.user.id !== request.user2) {
                    return interaction.reply({
                        content: "This request is not for you.",
                        ephemeral: true
                    });
                }

                if (request.status !== "pending") {
                    return interaction.reply({
                        content:
                            `This request is already ${request.status}.`,
                        ephemeral: true
                    });
                }

                request.status = "accepted";
                request.updatedAt =
                    new Date().toISOString();

                saveRequests(requests);

                const embed = new EmbedBuilder()
                    .setColor("#00BFFF")
                    .setTitle("MM Request Accepted")
                    .setDescription(
                        `**User 1:** <@${request.user1}>\n` +
                        `**User 2:** <@${request.user2}>\n\n` +
                        `**User 1 gives:** ${request.user1Giving}\n` +
                        `**User 2 gives:** ${request.user2Giving}\n\n` +
                        `**Middleman:** <@${request.middleman}>\n\n` +
                        `Status: **Accepted**`
                    );

                await interaction.update({
                    embeds: [embed],
                    components: []
                });

                // Notify User 1
                const user1 = await client.users.fetch(
                    request.user1
                ).catch(() => null);

                if (user1) {

                    await user1.send({
                        embeds: [
                            embed
                        ]
                    }).catch(() => {});
                }

                // Notify Middleman
                const middleman = await client.users.fetch(
                    request.middleman
                ).catch(() => null);

                if (middleman) {

                    await middleman.send({
                        embeds: [
                            new EmbedBuilder()
                                .setColor("#00BFFF")
                                .setTitle("New MM Request Assigned")
                                .setDescription(
                                    `You have been selected as the Middleman for **MM #${request.id}**.\n\n` +
                                    `**User 1:** <@${request.user1}>\n` +
                                    `Giving: ${request.user1Giving}\n\n` +
                                    `**User 2:** <@${request.user2}>\n` +
                                    `Giving: ${request.user2Giving}\n\n` +
                                    `Status: **Accepted**`
                                )
                        ]
                    }).catch(() => {});
                }

                return;
            }

            // ==================================================
            // DECLINE
            // ==================================================

            if (interaction.customId.startsWith("mm_decline_")) {

                const id = interaction.customId.replace(
                    "mm_decline_",
                    ""
                );

                const requests = loadRequests();

                const request = requests.find(
                    r => String(r.id) === String(id)
                );

                if (!request) {
                    return interaction.reply({
                        content: "This request no longer exists.",
                        ephemeral: true
                    });
                }

                if (interaction.user.id !== request.user2) {
                    return interaction.reply({
                        content: "This request is not for you.",
                        ephemeral: true
                    });
                }

                if (request.status !== "pending") {
                    return interaction.reply({
                        content:
                            `This request is already ${request.status}.`,
                        ephemeral: true
                    });
                }

                request.status = "declined";
                request.updatedAt =
                    new Date().toISOString();

                saveRequests(requests);

                await interaction.update({
                    embeds: [
                        new EmbedBuilder()
                            .setColor("#00BFFF")
                            .setTitle("MM Request Declined")
                            .setDescription(
                                `MM #${request.id} has been declined.\n\n` +
                                `Status: **Declined**`
                            )
                    ],
                    components: []
                });

                const user1 = await client.users.fetch(
                    request.user1
                ).catch(() => null);

                if (user1) {

                    await user1.send({
                        embeds: [
                            new EmbedBuilder()
                                .setColor("#00BFFF")
                                .setTitle("MM Request Declined")
                                .setDescription(
                                    `<@${request.user2}> declined MM #${request.id}.\n\n` +
                                    `Status: **Declined**`
                                )
                        ]
                    }).catch(() => {});
                }

                return;
            }
        }

        // ==================================================
        // SELECT MENUS
        // ==================================================

        if (interaction.isStringSelectMenu()) {

            // ==================================================
            // SELECT MIDDLEMAN
            // ==================================================

            if (interaction.customId === "mm_select_staff") {

                const middlemanId =
                    interaction.values[0];

                const middleman =
                    await interaction.guild.members
                        .fetch(middlemanId)
                        .catch(() => null);

                if (!middleman) {
                    return interaction.update({
                        content:
                            "That Middleman is no longer in the server.",
                        embeds: [],
                        components: []
                    });
                }

                if (
                    !middleman.roles.cache.has(
                        process.env.MM_ROLE_ID
                    )
                ) {
                    return interaction.update({
                        content:
                            "That member is no longer an MM Staff member.",
                    
