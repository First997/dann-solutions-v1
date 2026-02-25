const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    name: "banner",
    description: "Exibe o banner de fundo do perfil de um usuário.",
    async run(ctx) {
        const user = ctx.mentions.users.first() || ctx.author || ctx.user;
        
        // O Discord exige um fetch forçado para pegar o banner
        const fullUser = await ctx.client.users.fetch(user.id, { force: true });

        if (!fullUser.banner) {
            return ctx.reply({ content: `❌ **ERRO:** O usuário **${user.username}** não possui um banner de perfil configurado.`, ephemeral: true });
        }

        const bannerURL = fullUser.bannerURL({ dynamic: true, size: 4096 });

        const embed = new EmbedBuilder()
            .setColor("#2B2D31")
            .setAuthor({ name: `Galeria de Perfil`, iconURL: user.displayAvatarURL() })
            .setTitle(`🖼️ Banner de ${user.username}`)
            .setImage(bannerURL)
            .setFooter({ text: `Requisitado por: ${ctx.author?.username || ctx.user.username}` });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setLabel('Download High Res').setURL(bannerURL).setStyle(ButtonStyle.Link)
        );

        ctx.reply({ embeds: [embed], components: [row] });
    }
};