const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("mm")
        .setDescription("Open the KaXro Cross Trade system"),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor("#87CEEB")
            .setTitle("KA7X CROSS TRADE")
            .setDescription(
                "Welcome to the KaXro Cross Trade system.\n\n" +
                "Create and manage secure cross trades with our Middleman team.\n\n" +
                "**Available Actions**\n" +
                "Start a new Cross Trade\n" +
                "View your active requests\n" +
                "View Middleman information\n" +
                "View Cross Trade rules"
            )
            .setFooter({
                text: "KA7X Middleman • Safe • Trusted • Secure"
            });

        const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("mm_start")
                .setLabel("Start Cross Trade")
                .setStyle(ButtonStyle.Primary),

            new ButtonBuilder()
                .setCustomId("mm_requests")
                .setLabel("My Requests")
                .setStyle(ButtonStyle.Secondary)
        );

        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("mm_info")
                .setLabel("MM Info")
                .setStyle(ButtonStyle.Secondary),

            new ButtonBuilder()
                .setCustomId("mm_rules")
                .setLabel("MM Rules")
                .setStyle(ButtonStyle.Secondary)
        );

        await interaction.reply({
            embeds: [embed],
            components: [row1, row2],
            ephemeral: true
        });
    }
};
