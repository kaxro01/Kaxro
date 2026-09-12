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

// ===============================
// COMMANDS
// ===============================

const commands = new Map();
const commandsPath = path.join(__dirname, "commands");

if (fs.existsSync(commandsPath)) {
    const files = fs.readdirSync(commandsPath)
        .filter(file => file.endsWith(".js"));

    for (const file of files) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);

        if (command.data && command.execute) {
            commands.set(command.data.name, command);
            console.log(`Loaded command: ${command.data.name}`);
        }
    }
}

// ===============================
// MM DATA
// ===============================

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

// ===============================
// MAIN INTERACTION HANDLER
// ===============================

client.on("interactionCreate", async interaction => {

    try {

        // ==========================================
        // SLASH COMMANDS
        // ==========================================

        if (interaction.isChatInputCommand()) {

            const command = commands.get(
                interaction.commandName
            );

            if (!command) return;

            await command.execute(interaction);

            return;
        }

        // ==========================================
        // BUTTONS
        // ==========================================

        if (interaction.isButton()) {

            // --------------------------------------
            // START MM
            // --------------------------------------

            if (interaction.customId === "mm_start") {

                const mmRoleId = process.env.MM_ROLE_ID;

                if (!mmRoleId) {
                    return interaction.update({
                        content: "MM_ROLE_ID is not configured.",
                        embeds: [],
                        components: []
                    });
                }

                const role = interaction.guild.roles.cache.get(
                    mmRoleId
                );

                if (!role) {
                    return interaction.update({
                        content: "The MM Staff role could not be found.",
                        embeds: [],
                        components: []
                    });
                }

                // Get MM staff members
                await interaction.guild.members.fetch();

                const mmMembers = interaction.guild.members.cache
                    .filter(member =>
                        member.roles.cache.has(mmRoleId) &&
                        !member.user.bot
                    )
                    .first(25);

                if (mmMembers.length === 0) {
                    return interaction.update({
                        content: "There are currently no MM Staff members available.",
                        embeds: [],
                        components: []
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

                const backRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId("mm_back")
                            .setLabel("Back")
                            .setStyle(ButtonStyle.Secondary)
                    );

                const embed = new EmbedBuilder()
                    .setColor("#C99A3D")
                    .setTitle("Choose a Middleman")
                    .setDescription(
                        "Choose which MM Staff member you want to handle this request."
                    );

                return interaction.update({
                    embeds: [embed],
                    components: [row, backRow]
                });
            }

            // --------------------------------------
            // BACK
            // --------------------------------------

            if (interaction.customId === "mm_back") {

                const embed = new EmbedBuilder()
                    .setColor("#C99A3D")
                    .setTitle("KA7X Middleman")
                    .setDescription(
                        "Use the buttons below to start a middleman request or view your requests."
                    );

                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId("mm_start")
                            .setLabel("Start MM")
                            .setStyle(ButtonStyle.Secondary),

                        new ButtonBuilder()
                            .setCustomId("mm_requests")
                            .setLabel("My Requests")
                            .setStyle(ButtonStyle.Secondary),

                        new ButtonBuilder()
                            .setCustomId("mm_info")
                            .setLabel("MM Info")
                            .setStyle(ButtonStyle.Secondary),

                        new ButtonBuilder()
                            .setCustomId("mm_rules")
                            .setLabel("MM Rules")
                            .setStyle(ButtonStyle.Secondary)
                    );

                return interaction.update({
                    embeds: [embed],
                    components: [row]
                });
            }

            // --------------------------------------
            // MY REQUESTS
            // --------------------------------------

            if (interaction.customId === "mm_requests") {

                const requests = loadRequests();

                const userRequests = requests
                    .filter(request =>
                        request.user1 === interaction.user.id ||
                        request.user2 === interaction.user.id ||
                        request.middleman === interaction.user.id
                    )
                    .sort(
                        (a, b) =>
                            new Date(b.createdAt) -
                            new Date(a.createdAt)
                    );

                if (userRequests.length === 0) {

                    const embed = new EmbedBuilder()
                        .setColor("#C99A3D")
                        .setTitle("My MM Requests")
                        .setDescription(
                            "You don't have any MM requests."
                        );

                    const row = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId("mm_back")
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
                        `User 1 giving: ${request.user1Giving}\n` +
                        `User 2 giving: ${request.user2Giving}\n` +
                        `Status: **${status}**\n\n`;
                }

                const embed = new EmbedBuilder()
                    .setColor("#C99A3D")
                    .setTitle("My MM Requests")
                    .setDescription(description);

                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId("mm_back")
                            .setLabel("Back")
                            .setStyle(ButtonStyle.Secondary)
                    );

                return interaction.update({
                    embeds: [embed],
                    components: [row]
                });
            }

            // --------------------------------------
            // ACCEPT
            // --------------------------------------

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
                        content: "This MM request no longer exists.",
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
                        content: `This request is already ${request.status}.`,
                        ephemeral: true
                    });
                }

                request.status = "accepted";
                request.updatedAt = new Date().toISOString();

                saveRequests(requests);

                const embed = new EmbedBuilder()
                    .setColor("#C99A3D")
                    .setTitle("MM Request Accepted")
                    .setDescription(
                        `**User 1:** <@${request.user1}>\n` +
                        `**User 2:** <@${request.user2}>\n` +
                        `**Middleman:** <@${request.middleman}>\n\n` +
                        `User 1 gives: ${request.user1Giving}\n` +
                        `User 2 gives: ${request.user2Giving}\n\n` +
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
                            new EmbedBuilder()
                                .setColor("#C99A3D")
                                .setTitle("MM Request Accepted")
                                .setDescription(
                                    `<@${request.user2}> accepted your request.\n\n` +
                                    `Middleman: <@${request.middleman}>\n\n` +
                                    `User 1 gives: ${request.user1Giving}\n` +
                                    `User 2 gives: ${request.user2Giving}`
                                )
                        ]
                    }).catch(() => {});
                }

                // Notify MM
                const middleman = await client.users.fetch(
                    request.middleman
                ).catch(() => null);

                if (middleman) {
                    await middleman.send({
                        embeds: [
                            new EmbedBuilder()
                                .setColor("#C99A3D")
                                .setTitle("New MM Request")
                                .setDescription(
                                    `You have been selected as the Middleman for MM #${request.id}.\n\n` +
                                    `User 1: <@${request.user1}>\n` +
                                    `Giving: ${request.user1Giving}\n\n` +
                                    `User 2: <@${request.user2}>\n` +
                                    `Giving: ${request.user2Giving}\n\n` +
                                    `Status: **Accepted**`
                                )
                        ]
                    }).catch(() => {});
                }

                return;
            }

            // --------------------------------------
            // DECLINE
            // --------------------------------------

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
                        content: "This MM request no longer exists.",
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
                        content: `This request is already ${request.status}.`,
                        ephemeral: true
                    });
                }

                request.status = "declined";
                request.updatedAt = new Date().toISOString();

                saveRequests(requests);

                const embed = new EmbedBuilder()
                    .setColor("#C99A3D")
                    .setTitle("MM Request Declined")
                    .setDescription(
                        "This middleman request has been declined."
                    );

                await interaction.update({
                    embeds: [embed],
                    components: []
                });

                const user1 = await client.users.fetch(
                    request.user1
                ).catch(() => null);

                if (user1) {
                    await user1.send({
                        embeds: [
                            new EmbedBuilder()
                                .setColor("#C99A3D")
                                .setTitle("MM Request Declined")
                                .setDescription(
                                    `<@${request.user2}> declined your MM request.\n\n` +
                                    `MM #${request.id}\n` +
                                    `Status: **Declined**`
                                )
                        ]
                    }).catch(() => {});
                }

                return;
            }

            // --------------------------------------
            // INFO
            // --------------------------------------

            if (interaction.customId === "mm_info") {

                const embed = new EmbedBuilder()
                    .setColor("#C99A3D")
                    .setTitle("MM Info")
                    .setDescription(
                        "KA7X Middleman provides a safe process for completing trades with a trusted MM Staff member."
                    );

                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId("mm_back")
                            .setLabel("Back")
                            .setStyle(ButtonStyle.Secondary)
                    );

                return interaction.update({
                    embeds: [embed],
                    components: [row]
                });
            }

            // --------------------------------------
            // RULES
            // --------------------------------------

            if (interaction.customId === "mm_rules") {

                const embed = new EmbedBuilder()
                    .setColor("#C99A3D")
                    .setTitle("MM Rules")
                    .setDescription(
                        "1. Follow the assigned MM's instructions.\n" +
                        "2. Do not fake proof.\n" +
                        "3. Do not rush the MM.\n" +
                        "4. Keep the trade inside the official MM process.\n" +
                        "5. Report any problems to MM Staff."
                    );

                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId("mm_back")
                            .setLabel("Back")
                            .setStyle(ButtonStyle.Secondary)
                    );

                return interaction.update({
                    embeds: [embed],
                    components: [row]
                });
            }
        }

        // ==========================================
        // SELECT MIDDLEMAN
        // ==========================================

        if (interaction.isStringSelectMenu()) {

            if (interaction.customId !== "mm_select_staff") {
                return;
            }

            const middlemanId = interaction.values[0];

            const member = await interaction.guild.members
                .fetch(middlemanId)
                .catch(() => null);

            if (!member) {
                return interaction.update({
                    content: "That Middleman is no longer in the server.",
                    embeds: [],
                    components: []
                });
            }

            const mmRoleId = process.env.MM_ROLE_ID;

            if (!member.roles.cache.has(mmRoleId)) {
                return interaction.update({
                    content: "That member is no longer an MM Staff member.",
                    embeds: [],
                    components: []
                });
            }

            // ==========================================
            // SELECT USER 2
            // ==========================================

            const select = new StringSelectMenu
