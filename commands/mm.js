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
                    .setLabel("MM Status")
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

        await interaction.reply({
            embeds: [embed],
            components: [row]
        });
    }
};
