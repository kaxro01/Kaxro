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
        .setDescription("Open the KA7X Middleman system"),

    async execute(interaction) {
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
                    .setLabel("MM Status")
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
