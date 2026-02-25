const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    name: "lock",
    description: "Tranca o canal para membros.",
    async run(ctx) {
        if (!ctx.member.permissions.has(PermissionFlagsBits.ManageChannels)) return ctx.reply("❌");

        await ctx.channel.permissionOverwrites.edit(ctx.guild.id, { SendMessages: false });
        
        const embed = new EmbedBuilder()
            .setColor("#E74C3C")
            .setTitle("🔒 Canal Trancado")
            .setDescription("Este canal foi selado pela moderação. Apenas administradores podem falar.")
            .setTimestamp();

        ctx.reply({ embeds: [embed] });
    }
};