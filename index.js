tion.update({
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
