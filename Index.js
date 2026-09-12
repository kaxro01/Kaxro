const {
  Client,
  GatewayIntentBits,
  Collection,
  REST,
  Routes,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, "commands");

for (const file of fs.readdirSync(commandsPath)) {
  if (!file.endsWith(".js")) continue;

  const command = require(path.join(commandsPath, file));

  if (command.data && command.execute) {
    client.commands.set(command.data.name, command);
    console.log("Loaded command:", command.data.name);
  }
}

client.once("clientReady", async () => {
  console.log("KaXro is online as", client.user.tag);

  const rest = new REST({ version: "10" }).setToken(process.env.BOT_TOKEN);

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

client.on("interactionCreate", async interaction => {

  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);

    if (command) {
      await command.execute(interaction);
    }

    return;
  }

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

    const giving1 = new TextInputBuilder()
      .setCustomId("giving1")
      .setLabel("What is User 1 giving?")
      .setPlaceholder("Example: Meowl")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    const giving2 = new TextInputBuilder()
      .setCustomId("giving2")
      .setLabel("What is User 2 giving?")
      .setPlaceholder("Example: Dragon Cannelloni")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(user1),
      new ActionRowBuilder().addComponents(user2),
      new ActionRowBuilder().addComponents(giving1),
      new ActionRowBuilder().addComponents(giving2)
    );

    await interaction.showModal(modal);
    return;
  }

  if (interaction.isModalSubmit() && interaction.customId === "cross_trade") {

    const user1 = interaction.fields.getTextInputValue("user1");
    const user2 = interaction.fields.getTextInputValue("user2");
    const giving1 = interaction.fields.getTextInputValue("giving1");
    const giving2 = interaction.fields.getTextInputValue("giving2");

    await interaction.reply({
      content:
        `User 1: ${user1}\n` +
        `User 2: ${user2}\n` +
        `User 1 giving: ${giving1}\n` +
        `User 2 giving: ${giving2}`,
      ephemeral: true
    });

    return;
  }
});

client.login(process.env.BOT_TOKEN);
