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
        .setDescription("Open the KA7X Cross Trade Middleman system"),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor("#00BFFF")
            .setTitle("KA7X Middleman")
            .setDescription(
                "Welcome to the KA7X Cross Trade Middleman system.\n\n" +
                "Start a Cross Trade request below."
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

        await interaction.reply({
            embeds: [embed],
            components: [row, row2],
            ephemeral: true
        });
    }
};
