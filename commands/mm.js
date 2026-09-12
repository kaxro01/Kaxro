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
                "Use the buttons below to start a middleman request or view information.\n\n" +
                "Both members must be in this server."
            );

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("mm_start")
                    .setLabel("Start MM")
                    .setStyle(ButtonStyle.Secondary),

                new ButtonBuilder()
                    .setCustomId("mm_info")
                    .setLabel("MM Info")
                    .setStyle(ButtonStyle.Secondary),

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
            components: [row]
        });
    }
};
