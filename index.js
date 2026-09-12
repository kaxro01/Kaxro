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
    const files = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

    for (const file of files) {
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
        const rest = new REST({ version: "10" }).setToken(
            process.env.BOT_TOKEN
        );

        const commands = [...client.commands.values()].map(command =>
            command.data.toJSON()
        );

        await rest.put(
            Routes.applicationGuildCommands(
                process.env.CLIENT_ID,
                process.env.GUILD_ID
            ),
            {
                body: commands
            }
        );

        console.log(`Deployed ${commands.length} command(s) successfully.`);
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
                .setCustomId("cross_trade_form")
                .setTitle("Cross Trade");

            const user1 = new TextInputBuilder()
                .setCustomId("user1")
                .setLabel("User 1")
                .setPlaceholder("Enter User 1 ID or mention")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const user2 = new TextInputBuilder()
                .setCustomId("user2")
                .setLabel("User 2")
                .setPlaceholder("Enter User 2 ID or mention")
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

        // CROSS TRADE FORM
        if (
            interaction.isModalSubmit() &&
            interaction.customId === "cross_trade_form"
        ) {
            const user1Input = interaction.fields.getTextInputValue("user1");
            const user2Input = interaction.fields.getTextInputValue("user2");

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
                    "Check the details below before continuing."
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
                    text: "KA7X Middleman"
                });

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId("cross_trade_confirm")
                        .setLabel("Confirm")
                        .setStyle(ButtonStyle.Success),

                    new ButtonBuilder()
                        .setCustomId("cross_trade_cancel")
                        .setLabel("Cancel")
                        .setStyle(ButtonStyle.Danger)
                );

            await interaction.reply({
                embeds: [embed],
                components: [row],
                ephemeral: true
            });

            return;
        }

        // CONFIRM
        if (
            interaction.isButton() &&
            interaction.customId === "cross_trade_confirm"
        ) {
            const embed = new EmbedBuilder()
                .setColor("#00BFFF")
                .setTitle("Cross Trade Request")
                .setDescription(
                    "Your Cross Trade request has been created.\n\n" +
                    "A Middleman can now handle the trade."
                );

            await interaction.update({
                embeds: [embed],
                components: []
            });

            return;
        }

        // CANCEL
        if (
            interaction.isButton() &&
            interaction.customId === "cross_trade_cancel"
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

        // MY REQUESTS
        if (
            interaction.isButton() &&
            interaction.customId === "mm_requests"
        ) {
            const embed = new EmbedBuilder()
                .setColor("#00BFFF")
                .setTitle("My Requests")
                .setDescription(
                    "You have no previous Cross Trade requests."
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
                    "KA7X Middleman helps users safely complete Cross Trades between different games.\n\n" +
                    "Both sides are checked before the trade is completed."
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
                    "1. Follow the assigned Middleman's instructions.\n\n" +
                    "2. Do not leave during an active trade.\n\n" +
                    "3. Do not fake proof.\n\n" +
                    "4. Give exactly what was agreed.\n\n" +
                    "5. Do not rush the Middleman."
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

        // HOME
        if (
            interaction.isButton() &&
            interaction.customId === "mm_home"
        ) {
            const embed = new EmbedBuilder()
                .setColor("#00BFFF")
                .setTitle("KA7X Middleman")
                .setDescription(
                    "Welcome to the KA7X Cross Trade Middleman system.\n\n" +
                    "Start a Cross Trade or view your previous requests."
                )
                .setFooter({
                    text: "KA7X Middleman • Safe • Trusted • Secure"
                });

            const row1 = new ActionRowBuilder()
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
                components: [row1, row2]
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
