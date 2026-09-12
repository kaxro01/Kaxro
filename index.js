const {
    Client,
    GatewayIntentBits,
    Collection,
    REST,
    Routes,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
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

client.commands = new Collection();

const commandsPath = path.join(__dirname, "commands");

if (fs.existsSync(commandsPath)) {
    const commandFiles = fs
        .readdirSync(commandsPath)
        .filter(file => file.endsWith(".js"));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);

        if (command.data && command.execute) {
            client.commands.set(command.data.name, command);
            console.log(`Loaded command: ${command.data.name}`);
        }
    }
}

client.once("clientReady", async () => {
    console.log(`KaXro is online as ${client.user.tag}`);

    try {
        const rest = new REST({ version: "10" })
            .setToken(process.env.BOT_TOKEN);

        const commandData = [...client.commands.values()]
            .map(command => command.data.toJSON());

        await rest.put(
            Routes.applicationGuildCommands(
                process.env.CLIENT_ID,
                process.env.GUILD_ID
            ),
            {
                body: commandData
            }
        );

        console.log(`Deployed ${commandData.length} command(s).`);
    } catch (error) {
        console.error("Command deployment error:", error);
    }
});

client.on("interactionCreate", async interaction => {
    try {

        // SLASH COMMANDS
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);

            if (!command) return;

            await command.execute(interaction);
            return;
        }

        // START CROSS TRADE
        if (
            interaction.isButton() &&
            interaction.customId === "mm_start"
        ) {
            const modal = new ModalBuilder()
                .setCustomId("mm_cross_trade")
                .setTitle("Cross Trade Details");

            const user1 = new TextInputBuilder()
                .setCustomId("user1")
                .setLabel("User 1")
                .setPlaceholder("User 1 ID or @mention")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const user2 = new TextInputBuilder()
                .setCustomId("user2")
                .setLabel("User 2")
                .setPlaceholder("User 2 ID or @mention")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const user1Giving = new TextInputBuilder()
                .setCustomId("user1_giving")
                .setLabel("What is User 1 giving?")
                .setPlaceholder("Example: 1x Meowl")
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);

            const user2Giving = new TextInputBuilder()
                .setCustomId("user2_giving")
                .setLabel("What is User 2 giving?")
                .setPlaceholder("Example: 2x Brainrots")
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);

            modal.addComponents(
                new ActionRowBuilder().addComponents(user1),
                new ActionRowBuilder().addComponents(user2),
                new ActionRowBuilder().addComponents(user1Giving),
                new ActionRowBuilder().addComponents(user2Giving)
            );

            await interaction.showModal(modal);
            return;
        }

        // CROSS TRADE FORM SUBMITTED
        if (
            interaction.isModalSubmit() &&
            interaction.customId === "mm_cross_trade"
        ) {
            const user1Input =
                interaction.fields.getTextInputValue("user1");

            const user2Input =
                interaction.fields.getTextInputValue("user2");

            const user1Giving =
                interaction.fields.getTextInputValue("user1_giving");

            const user2Giving =
                interaction.fields.getTextInputValue("user2_giving");

            const user1Id = user1Input.replace(/[<@!>]/g, "");
            const user2Id = user2Input.replace(/[<@!>]/g, "");

            const member1 = await interaction.guild.members
                .fetch(user1Id)
                .catch(() => null);

            const member2 = await interaction.guild.members
                .fetch(user2Id)
                .catch(() => null);

            if (!member1) {
                await interaction.reply({
                    content: "User 1 is not in this server.",
                    ephemeral: true
                });
                return;
            }

            if (!member2) {
                await interaction.reply({
                    content: "User 2 is not in this server.",
                    ephemeral: true
                });
                return;
            }

            if (member1.id === member2.id) {
                await interaction.reply({
                    content: "User 1 and User 2 cannot be the same person.",
                    ephemeral: true
                });
                return;
            }

            const embed = new EmbedBuilder()
                .setColor("#00BFFF")
                .setTitle("Cross Trade Details")
                .setDescription(
                    "Check the information below before creating the request."
                )
                .addFields(
                    {
                        name: "User 1",
                        value: `<@${member1.id}>`,
                        inline: false
                    },
                    {
                        name: "User 2",
                        value: `<@${member2.id}>`,
                        inline: false
                    },
                    {
                        name: "User 1 is giving",
                        value: user1Giving,
                        inline: false
                    },
                    {
                        name: "User 2 is giving",
                        value: user2Giving,
                        inline: false
                    }
                )
                .setFooter({
                    text: "KA7X Middleman • Cross Trade"
                });

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId("mm_confirm")
                        .setLabel("Confirm")
                        .setStyle(ButtonStyle.Success),

                    new ButtonBuilder()
                        .setCustomId("mm_cancel")
                        .setLabel("Cancel")
                        .setStyle(ButtonStyle.Danger)
                );

            await interaction.update({
                embeds: [embed],
                components: [row]
            });

            return;
        }

        // CANCEL
        if (
            interaction.isButton() &&
            interaction.customId === "mm_cancel"
        ) {
            const embed = new EmbedBuilder()
                .setColor("#00BFFF")
                .setTitle("Cross Trade Cancelled")
                .setDescription(
                    "Your Cross Trade request has been cancelled."
                );

            await interaction.update({
                embeds: [embed],
                components: []
            });

            return;
        }

        // CONFIRM
        if (
            interaction.isButton() &&
            interaction.customId === "mm_confirm"
        ) {
            const embed = new EmbedBuilder()
                .setColor("#00BFFF")
                .setTitle("Cross Trade Request Created")
                .setDescription(
                    "Your Cross Trade request has been created.\n\n" +
                    "The next step is to assign a Middleman."
                );

            await interaction.update({
                embeds: [embed],
                components: []
            });

            return;
        }

        // MY REQUESTS
        if (
            interaction.isButton() &&
            interaction.customId === "mm_requests"
        ) {
            const embed = new EmbedBuilder()
                .setColor("#00BFFF")
                .setTitle("My MM Requests")
                .setDescription(
                    "You currently have no Cross Trade requests."
                );

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId("mm_home")
                        .setLabel("Back")
                        .setStyle(ButtonStyle.Secondary)
                );

            await interaction.update({
                embeds: [embed],
                components: [row]
            });

            return;
        }

        // MM INFO
        if (
            interaction.isButton() &&
            interaction.customId === "mm_info"
        ) {
            const embed = new EmbedBuilder()
                .setColor("#00BFFF")
                .setTitle("MM Info")
                .setDescription(
                    "KA7X Middleman provides a secure way to complete Cross Trades between different games.\n\n" +
                    "A Middleman verifies both sides before releasing the items."
                );

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId("mm_home")
                        .setLabel("Back")
                        .setStyle(ButtonStyle.Secondary)
                );

            await interaction.update({
                embeds: [embed],
                components: [row]
            });

            return;
        }

        // MM RULES
        if (
            interaction.isButton() &&
            interaction.customId === "mm_rules"
        ) {
            const embed = new EmbedBuilder()
                .setColor("#00BFFF")
                .setTitle("MM Rules")
                .setDescription(
                    "1. Follow the instructions of the assigned Middleman.\n\n" +
                    "2. Do not leave the trade while it is active.\n\n" +
                    "3. Do not fake or edit proof.\n\n" +
                    "4. Both traders must provide exactly what was agreed.\n\n" +
                    "5. The Middleman has the final decision during the trade."
                );

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId("mm_home")
                        .setLabel("Back")
                        .setStyle(ButtonStyle.Secondary)
                );

            await interaction.update({
                embeds: [embed],
                components: [row]
            });

            return;
        }

        // BACK TO HOME
        if (
            interaction.isButton() &&
            interaction.customId === "mm_home"
        ) {
            const embed = new EmbedBuilder()
                .setColor("#00BFFF")
                .setTitle("KA7X Middleman")
                .setDescription(
                    "Welcome to the KA7X Cross Trade Middleman system.\n\n" +
                    "Start a new Cross Trade or check your previous requests."
                )
                .setFooter({
                    text: "KA7X Middleman • Safe • Trusted • Secure"
                });

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId("mm_start")
                        .setLabel("Start Cross Trade")
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

            await interaction.update({
                embeds: [embed],
                components: [row, row2]
            });

            return;
        }

    } catch (error) {
        console.error("Interaction error:", error);

        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: "Something went wrong. Please try again.",
                ephemeral: true
            }).catch(() => {});
        }
    }
});

client.login(process.env.BOT_TOKEN);                    
