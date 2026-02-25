const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: "av",
    aliases: ["avatar", "pfp", "forense", "steal"],
    description: "Sistema avançado de análise e extração de mídia.",
    async run(ctx, args) {
        const author = ctx.author || ctx.user;
        const target = ctx.mentions.members.first() || ctx.guild.members.cache.get(args[0]) || ctx.member;
        const { user } = target;

        // --- DEEP FETCH (BUSCA PROFUNDA) ---
        const userFetch = await ctx.client.users.fetch(user.id, { force: true });
        
        const assets = {
            global: user.displayAvatarURL({ dynamic: true, size: 4096 }),
            server: target.avatarURL({ dynamic: true, size: 4096 }),
            banner: userFetch.bannerURL({ dynamic: true, size: 4096 }),
            color: userFetch.hexAccentColor || "#2B2D31"
        };

        // --- LÓGICA DE GERAÇÃO DE EMBED ---
        const generateEmbed = (type) => {
            const img = assets[type] || assets.global;
            const isGif = img.includes('.gif');
            
            return new EmbedBuilder()
                .setColor(assets.color)
                .setAuthor({ name: `ANÁLISE FORENSE DE MÍDIA`, iconURL: "https://i.imgur.com/8Q9Z5O6.png" })
                .setTitle(`🔍 Documento: ${type.toUpperCase()}`)
                .setDescription(
                    "```ansi\n" +
                    `\u001b[1;37mFONTE:\u001b[0m   \u001b[1;34m${user.tag}\u001b[0m\n` +
                    `\u001b[1;37mFORMATO:\u001b[0m \u001b[1;32m${isGif ? 'ANIMATED (GIF)' : 'STATIC (IMG)'}\u001b[0m\n` +
                    `\u001b[1;37mRES:\u001b[0m     \u001b[1;33m4096x4096 (UHD)\u001b[0m\n` +
                    "```"
                )
                .addFields({ 
                    name: "🌐 Rastreamento de Imagem", 
                    value: `[Google Lens](https://lens.google.com/uploadbyurl?url=${img}) | [Yandex Search](https://yandex.com/images/search?rpt=imageview&url=${img})`,
                    inline: false 
                })
                .setImage(img)
                .setFooter({ text: `Protocolo de Visualização Dann Solutions` })
                .setTimestamp();
        };

        // --- BOTÕES EXCLUSIVOS ---
        const getButtons = (active) => {
            const row1 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('v_global').setLabel('Global').setStyle(active === 'global' ? ButtonStyle.Primary : ButtonStyle.Secondary).setDisabled(active === 'global'),
                new ButtonBuilder().setCustomId('v_server').setLabel('Servidor').setStyle(active === 'server' ? ButtonStyle.Primary : ButtonStyle.Secondary).setDisabled(!assets.server || assets.server === assets.global || active === 'server'),
                new ButtonBuilder().setCustomId('v_banner').setLabel('Banner').setStyle(active === 'banner' ? ButtonStyle.Primary : ButtonStyle.Secondary).setDisabled(!assets.banner || active === 'banner')
            );

            const row2 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setLabel('Download Original').setURL(assets[active] || assets.global).setStyle(ButtonStyle.Link),
                new ButtonBuilder().setCustomId('v_steal').setLabel('Sincronizar Bot (Steal)').setStyle(ButtonStyle.Danger).setEmoji('👺')
            );

            return [row1, row2];
        };

        const msg = await ctx.reply({ 
            embeds: [generateEmbed('global')], 
            components: getButtons('global'),
            fetchReply: true 
        });

        const collector = msg.createMessageComponentCollector({
            filter: i => i.user.id === author.id,
            time: 300000 
        });

        collector.on('collect', async i => {
            // --- SISTEMA DE STEAL (ROUBAR AVATAR) ---
            if (i.customId === 'v_steal') {
                // Só o dono do bot ou admins podem usar isso
                if (i.user.id !== ctx.guild.ownerId) {
                    return i.reply({ content: "❌ **ACESSO NEGADO:** Apenas o proprietário do servidor pode sincronizar o bot.", ephemeral: true });
                }

                const currentImg = assets.global; // Pega o avatar que está sendo visto
                await ctx.client.user.setAvatar(currentImg);
                return i.reply({ content: "✅ **SINCRONIZAÇÃO CONCLUÍDA:** Eu agora possuo a mesma identidade que o alvo.", ephemeral: true });
            }

            const type = i.customId.replace('v_', '');
            await i.update({ 
                embeds: [generateEmbed(type)], 
                components: getButtons(type) 
            });
        });

        collector.on('end', () => {
            msg.edit({ components: [] }).catch(() => null);
        });
    }
};