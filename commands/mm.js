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
        .setDescription("Open the KaXro Middleman panel"),

    async execute(interaction) {

        const embed = new EmbedBuilder()
            .setTitle("KA7X Middleman")
            .setDescription(
                "Safe and trusted middleman service for your trades.\n\n" +
                "Use the buttons below to start an MM or view information."
            );

        const row1 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("mm_start")
                    .setLabel("Start MM")
                    .setStyle(ButtonStyle.Primary),

                new ButtonBuilder()
                    .setCustomId("mm_info")
                    .setLabel("MM Info")
                    .setStyle(ButtonStyle.Secondary)
            );

        const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("mm_rules")
                    .setLabel("MM Rules")
                    .setStyle(ButtonStyle.Secondary),

                new ButtonBuilder()
                    .setCustomId("mm_status")
                    .setLabel("MM Status")
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.reply({
            embeds: [embed],
            components: [row1, row2]
        });
    }
};
