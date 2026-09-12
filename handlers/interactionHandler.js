const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

module.exports = async (interaction) => {
    if (!interaction.isButton()) return;

    if (interaction.customId === "mm_start") {
        const embed = new EmbedBuilder()
            .setTitle("Start Middleman")
            .setDescription(
                "Before starting an MM, make sure both traders are ready.\n\n" +
                "Click Continue to create your MM request."
            );

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("mm_continue")
                    .setLabel("Continue")
                    .setStyle(ButtonStyle.Primary),

                new ButtonBuilder()
                    .setCustomId("mm_cancel")
                    .setLabel("Cancel")
                    .setStyle(ButtonStyle.Secondary)
            );

        return interaction.reply({
            embeds: [embed],
            components: [row],
            ephemeral: true
        });
    }

    if (interaction.customId === "mm_cancel") {
        return interaction.update({
            content: "MM request cancelled.",
            embeds: [],
            components: []
        });
    }

    if (interaction.customId === "mm_continue") {
        const embed = new EmbedBuilder()
            .setTitle("MM Request")
            .setDescription(
                "Your MM request has been created.\n\n" +
                "Please wait for an MM Staff member to claim your request."
            );

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("mm_cancel_request")
                    .setLabel("Cancel Request")
                    .setStyle(ButtonStyle.Danger)
            );

        return interaction.update({
            embeds: [embed],
            components: [row]
        });
    }

    if (interaction.customId === "mm_cancel_request") {
        return interaction.update({
            content: "Your MM request has been cancelled.",
            embeds: [],
            components: []
        });
    }

    if (interaction.customId === "mm_info") {
        const embed = new EmbedBuilder()
            .setTitle("MM Info")
            .setDescription(
                "KA7X Middleman provides a safe way to complete trades.\n\n" +
                "An MM Staff member handles the trade and verifies both sides before completing it."
            );

        return interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
    }

    if (interaction.customId === "mm_rules") {
        const embed = new EmbedBuilder()
            .setTitle("MM Rules")
            .setDescription(
                "1. Follow the instructions given by the MM.\n" +
                "2. Do not fake proof or provide false information.\n" +
                "3. Do not rush the MM.\n" +
                "4. Never trade outside the official MM process.\n" +
                "5. Report any issue to MM Staff."
            );

        return interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
    }

    if (interaction.customId === "mm_status") {
        const embed = new EmbedBuilder()
            .setTitle("MM Status")
            .setDescription(
                "MM service is currently available.\n\n" +
                "Start an MM using the `Start MM` button."
            );

        return interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
    }
};
