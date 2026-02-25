const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: "vip",
    description: "Verifica seu status VIP.",
    async run(ctx) {
        const member = ctx.member;
        const roleID = "ID_DO_SEU_CARGO_VIP_AQUI"; // COLOQUE O ID DO CARGO AQUI
        
        const temVip = member.roles.cache.has(roleID);

        const embed = new EmbedBuilder()
            .setColor(temVip ? "#FFD700" : "#2B2D31")
            .setTitle("💎 Status VIP")
            .setDescription(temVip ? 
                `Olá ${member}, você é um membro **VIP**! Aproveite seus benefícios exclusivos.` : 
                `Olá ${member}, você ainda não é um membro VIP. Adquira para ter acesso a comandos especiais!`)
            .setThumbnail(ctx.user?.displayAvatarURL() || ctx.author?.displayAvatarURL());

        ctx.reply({ embeds: [embed] });
    }
};