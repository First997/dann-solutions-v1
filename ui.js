const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, time } = require('discord.js');

module.exports = {
    name: "ui",
    aliases: ["userinfo", "perfil", "whois", "dossie"],
    description: "Extrai o dossiê completo de inteligência de um cidadão.",
    async run(ctx, args) {
        const member = ctx.mentions.members.first() || ctx.guild.members.cache.get(args[0]) || ctx.member;
        const { user } = member;
        const client = ctx.client;

        // --- SISTEMA DE TRADUÇÃO DE BADGES (ELITE) ---
        const flags = {
            Staff: "🛠️ Staff do Discord",
            Partner: "🤝 Parceiro do Discord",
            Hypesquad: "🏠 HypeSquad Events",
            BugHunterLevel1: "🐛 Bug Hunter V1",
            BugHunterLevel2: "🐛 Bug Hunter V2",
            HypeSquadOnlineHouse1: "🛡️ Bravery",
            HypeSquadOnlineHouse2: "💎 Brilliance",
            HypeSquadOnlineHouse3: "⚖️ Balance",
            PremiumEarlySupporter: "💎 Early Supporter",
            TeamPseudoUser: "👥 Equipe",
            VerifiedBot: "🤖 Bot Verificado",
            VerifiedDeveloper: "💻 Desenvolvedor Verificado"
        };

        const userFlags = user.flags.toArray();
        const badges = userFlags.length ? userFlags.map(f => flags[f]).join(", ") : "Nenhum registro especial";

        // --- CÁLCULO DE HIERARQUIA ---
        const roles = member.roles.cache
            .filter(r => r.id !== ctx.guild.id)
            .sort((a, b) => b.position - a.position)
            .map(r => r)
            .slice(0, 5); // Mostra apenas os 5 principais para não poluir

        const remainingRoles = member.roles.cache.size - 6;

        // --- INTERFACE DO DOSSIÊ ---
        const uiEmbed = new EmbedBuilder()
            .setColor(member.displayHexColor || "#2B2D31")
            .setAuthor({ 
                name: `ARQUIVO GOVERNAMENTAL: ${user.tag}`, 
                iconURL: "https://i.imgur.com/8Q9Z5O6.png" 
            })
            .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 1024 }))
            .setTitle(`🪪 Registro de Identidade: ${user.globalName || user.username}`)
            .setDescription(
                `As informações abaixo foram recuperadas dos servidores centrais. O indivíduo é considerado **${user.bot ? "ENTIDADE ARTIFICIAL" : "CIDADÃO AUTORIZADO"}**.`
            )
            .addFields(
                { 
                    name: "📡 Dados de Conexão", 
                    value: `**> ID:** \`${user.id}\`\n**> Badges:** ${badges}\n**> Status:** \`${member.presence?.status || 'offline'}\``, 
                    inline: false 
                },
                { 
                    name: "📅 Cronologia", 
                    value: `**> Registro no Discord:** ${time(user.createdAt, 'F')} (${time(user.createdAt, 'R')})\n**> Ingresso no Setor:** ${time(member.joinedAt, 'F')} (${time(member.joinedAt, 'R')})`, 
                    inline: false 
                },
                { 
                    name: "🎭 Atribuições Hierárquicas", 
                    value: `${roles.join(" ")} ${remainingRoles > 0 ? `e mais \`${remainingRoles}\` cargos` : ""}`, 
                    inline: false 
                }
            )
            .setImage(user.bannerURL({ size: 1024 }) || null) // Exibe o banner direto se houver
            .setFooter({ text: `Requisitado por: ${ctx.author?.tag || ctx.user.tag}` })
            .setTimestamp();

        // Verificação de Admin para destaque
        if (member.permissions.has(PermissionFlagsBits.Administrator)) {
            uiEmbed.addFields({ name: "⚠️ Nível de Acesso", value: "```ansi\n\u001b[1;31mAUTORIDADE MÁXIMA (ADMINISTRADOR)\u001b[0m\n```" });
        }

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('Ver Avatar Full HD')
                .setURL(user.displayAvatarURL({ size: 4096, dynamic: true }))
                .setStyle(ButtonStyle.Link),
            new ButtonBuilder()
                .setCustomId('ui_delete')
                .setLabel('Encerrar Consulta')
                .setStyle(ButtonStyle.Danger)
        );

        const msg = await ctx.reply({ embeds: [uiEmbed], components: [row], fetchReply: true });

        // Coletor para o botão de apagar (para privacidade)
        const collector = msg.createMessageComponentCollector({
            filter: i => i.user.id === (ctx.author?.id || ctx.user.id),
            time: 60000
        });

        collector.on('collect', async i => {
            if (i.customId === 'ui_delete') await msg.delete().catch(() => null);
        });
    }
};