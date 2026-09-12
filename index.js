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
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

client.commands = new Collection();

// Load commands
const commandPath = path.join(__dirname, "commands");

for (const file of fs.readdirSync(commandPath).filter(f => f.endsWith(".js"))) {
    const command = require(path.join(commandPath, file));

    if (command.data && command.execute) {
        client.commands.set(command.data.name, command);
        console.log(`Loaded command: ${command.data.name}`);
    }
}

// Deploy commands automatically
client.once("clientReady", async () => {
    console.log(`KaXro is online as ${client.user.tag}`);

    const rest = new REST({ version: "10" })
        .setToken(process.env.BOT_TOKEN);

    await rest.put(
        Routes.applicationGuildCommands(
            process.env.CLIENT_ID,
            process.env.GUILD_ID
        ),
        {
            body: [...client.commands.values()].map(c => c.data.toJSON())
        }
    );

    console.log("Slash commands deployed.");
});

// Interactions
client.on("interactionCreate", async interaction => {

    // Slash commands
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (command) await command.execute(interaction);
        return;
    }

    // Start Cross Trade
    if (interaction.isButton() && interaction.customId === "mm_start") {

        const modal = new ModalBuilder()
            .setCustomId("cross_trade")
            .setTitle("Cross Trade");

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

        const give1 = new TextInputBuilder()
            .setCustomId("give1")
            .setLabel("What is User 1 giving?")
            .setPlaceholder("Example: Meowl")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        const give2 = new TextInputBuilder()
            .setCustomId("give2")
            .setLabel("What is User 2 giving?")
            .setPlaceholder("Example: Dragon Cannelloni")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(user1),
            new ActionRowBuilder().addComponents(user2),
            new ActionRowBuilder().addComponents(give1),
            new ActionRowBuilder().addComponents(give2)
        );

        await interaction.showModal(modal);
        return;
    }

    // Cross Trade submitted
    if (interaction.isModalSubmit() && interaction.customId === "cross_trade") {

        const user1 = interaction.fields.getTextInputValue("user1");
        const user2 = interaction.fields.getTextInputValue("user2");
        const give1 = interaction.fields.getTextInputValue("give1");
        const give2 = interaction.fields.getTextInputValue("give2");

        const id1 = user1.replace(/[<@!>]/g, "");
        const id2 = user2.replace(/[<@!>]/g, "");

        const member1 = await interaction.guild.members.fetch(id1).catch(() => null);
        const member2 = await interaction.guild.members.fetch(id2).catch(() => null);

        if (!member1) {
            return interaction.reply({
                content: "User 1 is not in this server.",
                ephemeral: true
            });
        }

        if (!member2) {
            return interaction.reply({
                content: "User 2 is not in this server.",
                ephemeral: true
            });
        }

        if (id1 === id2) {
            return interaction.reply({
                content: "User 1 and User 2 cannot be the same person.",
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setColor("#00BFFF")
            .setTitle("Cross Trade Details")
            .addFields(
                {
                    name: "User 1",
                    value: `<@${id1}>`
                },
                {
                    name: "User 2",
                    value: `<@${id2}>`
                },
                {
                    name: "User 1 is giving",
                    value: give1
                },
                {
                    name: "User 2 is giving",
                    value: give2
                }
            );

        const buttons = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("cross_confirm")
                .setLabel("Confirm")
                .setStyle(ButtonStyle.Success),

            new ButtonBuilder()
                .setCustomId("cross_cancel")
                .setLabel("Cancel")
                .setStyle(ButtonStyle.Danger)
        );

        await interaction.reply({
            embeds: [embed],
            components: [buttons],
            ephemeral: true
        });

        return;
    }

    // Confirm
    if (interaction.isButton() && interaction.customId === "cross_confirm") {
        await interaction.update({
            content: "Cross Trade request created.",
            embeds: [],
            components: []
        });
        return;
    }

    // Cancel
    if (interaction.isButton() && interaction.customId === "cross_cancel") {
        await interaction.update({
            content: "Cross Trade cancelled.",
            embeds: [],
            components: []
        });
    }
});

client.login(process.env.BOT_TOKEN);
