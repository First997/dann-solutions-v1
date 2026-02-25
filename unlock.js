const { PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: "unlock",
    description: "Destranca o canal atual.",
    async run(ctx) {
        if (!ctx.member.permissions.has(PermissionFlagsBits.ManageChannels)) return ctx.reply("❌ Sem permissão.");

        await ctx.channel.permissionOverwrites.edit(ctx.guild.id, { SendMessages: true });
        ctx.reply("🔓 Este canal foi destrancado!");
    }
};