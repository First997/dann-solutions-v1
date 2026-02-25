const { PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: "addcargo",
    description: "Adiciona um cargo a um membro.",
    async run(ctx, args) {
        if (!ctx.member.permissions.has(PermissionFlagsBits.ManageRoles)) return ctx.reply("❌ Sem permissão.");

        const target = ctx.mentions.members.first();
        const role = ctx.mentions.roles.first();

        if (!target || !role) return ctx.reply("❌ Use: `d!addcargo @membro @cargo`.");

        await target.roles.add(role);
        ctx.reply(`✅ O cargo ${role.name} foi entregue para ${target.user.username}.`);
    }
};