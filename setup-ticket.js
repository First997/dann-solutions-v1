
const { 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    PermissionFlagsBits,
    MessageFlags,
    ChannelSelectMenuBuilder,
    RoleSelectMenuBuilder, 
    ChannelType
} = require('discord.js');
const JsoningLib = require("jsoning");
const Jsoning = typeof JsoningLib === "function" ? JsoningLib : JsoningLib.default;
const db = new Jsoning("database.json");

module.exports = {
    name: "setup-ticket",
    aliases: ["ticket-manager"],
    description: "Gerencia a configuração da Central de Atendimento.",
    slashData: {
        name: "setup-ticket",
        description: "Abre o painel de configuração do sistema de tickets."
    },

    async run(ctx) {
        // Bloqueio de segurança: Somente administradores acessam o PAINEL DE CONFIGURAÇÃO
        if (!ctx.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return ctx.reply({ content: "⚠️ **ACESSO NEGADO:** Apenas administradores podem configurar o sistema.", flags: [MessageFlags.Ephemeral] });
        }

        // --- BUSCA CONFIGURAÇÃO ATUAL ---
        const config = await db.get(`ticket_config_${ctx.guild.id}`) || { logChannel: null, category: null, staffRole: null };

        const renderConfigEmbed = () => {
            const isReady = config.logChannel && config.category && config.staffRole;
            return new EmbedBuilder()
                .setColor("#2B2D31")
                .setTitle("⚙️ Painel de Configuração • DANN SOLUTIONS")
                .setDescription(
                    "Configure os canais e cargos abaixo. Após configurar, clique em **PUBLICAR** para enviar o painel aos membros.\n\n" +
                    `🛰️ **Status:** ${isReady ? "🟢 Configurado" : "🔴 Pendente"}\n\n` +
                    `📂 **Categoria de Destino:** ${config.category ? `<#${config.category}>` : "`🔴 Pendente`"}\n` +
                    `📜 **Canal de Logs:** ${config.logChannel ? `<#${config.logChannel}>` : "`🔴 Pendente`"}\n` +
                    `👮 **Cargo Responsável:** ${config.staffRole ? `<@&${config.staffRole}>` : "`🔴 Pendente`"}\n`
                )
                .setFooter({ text: "Este painel é visível apenas para você." });
        };

        // --- COMPONENTES DO PAINEL ADM ---
        const categoryRow = new ActionRowBuilder().addComponents(
            new ChannelSelectMenuBuilder()
                .setCustomId('setup_select_category')
                .setPlaceholder('📂 Onde os tickets serão criados?')
                .setChannelTypes(ChannelType.GuildCategory)
        );

        const logRow = new ActionRowBuilder().addComponents(
            new ChannelSelectMenuBuilder()
                .setCustomId('setup_select_logs')
                .setPlaceholder('📜 Onde os logs serão enviados?')
                .setChannelTypes(ChannelType.GuildText)
        );

        const staffRow = new ActionRowBuilder().addComponents(
            new RoleSelectMenuBuilder()
                .setCustomId('setup_select_staff')
                .setPlaceholder('👮 Quem atenderá os tickets?')
        );

        const actionRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('deploy_ticket')
                .setLabel('PUBLICAR PARA MEMBROS')
                .setStyle(ButtonStyle.Success)
                .setEmoji('🚀')
                .setDisabled(!(config.logChannel && config.category && config.staffRole)),
            new ButtonBuilder()
                .setCustomId('reset_ticket_cfg')
                .setLabel('REINICIAR')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('🗑️')
        );

        // O painel de setup inicial é SEMPRE efêmero para não sujar o chat
        const response = await ctx.reply({ 
            embeds: [renderConfigEmbed()], 
            components: [categoryRow, logRow, staffRow, actionRow],
            fetchReply: true,
            ephemeral: true 
        });

        const collector = response.createMessageComponentCollector({ 
            filter: i => i.user.id === (ctx.author?.id || ctx.user?.id), 
            time: 300000 
        });

        collector.on('collect', async i => {
            if (i.customId === 'setup_select_category') config.category = i.values[0];
            if (i.customId === 'setup_select_logs') config.logChannel = i.values[0];
            if (i.customId === 'setup_select_staff') config.staffRole = i.values[0];

            if (i.customId === 'reset_ticket_cfg') {
                config.category = null;
                config.logChannel = null;
                config.staffRole = null;
                await db.delete(`ticket_config_${ctx.guild.id}`);
            } else {
                await db.set(`ticket_config_${ctx.guild.id}`, config);
            }

            // --- DEPLOY (O QUE O MEMBRO VAI VER) ---
            if (i.customId === 'deploy_ticket') {
                const memberEmbed = new EmbedBuilder()
                    .setColor("#2B2D31")
                    .setAuthor({ name: ctx.guild.name, iconURL: ctx.guild.iconURL() })
                    .setTitle("📩 Central de Suporte e Atendimento")
                    .setDescription(
                        "Bem-vindo ao nosso suporte! Escolha uma das categorias abaixo para iniciar seu atendimento.\n\n" +
                        "**🛡️ Denúncias:** Reporte jogadores ou bugs.\n" +
                        "**💎 Financeiro:** VIP, Loja e Doações.\n" +
                        "**🛠️ Suporte:** Dúvidas gerais e auxílio."
                    )
                    .setFooter({ text: "Clique em uma opção para ler as instruções do setor." });

                const memberButtons = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('pre_ticket_denuncia').setLabel('DENÚNCIA').setStyle(ButtonStyle.Danger).setEmoji('🛡️'),
                    new ButtonBuilder().setCustomId('pre_ticket_financeiro').setLabel('FINANCEIRO').setStyle(ButtonStyle.Success).setEmoji('💎'),
                    new ButtonBuilder().setCustomId('pre_ticket_suporte').setLabel('SUPORTE').setStyle(ButtonStyle.Primary).setEmoji('🛠️')
                );

                // Envia no canal onde o comando foi usado, mas de forma pública
                await i.channel.send({ embeds: [memberEmbed], components: [memberButtons] });
                return await i.update({ content: "✅ **Painel enviado com sucesso para o canal!**", embeds: [], components: [] });
            }

            // Atualiza o painel de configuração (ADM)
            await i.update({ 
                embeds: [renderConfigEmbed()], 
                components: [
                    categoryRow, 
                    logRow, 
                    staffRow, 
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('deploy_ticket').setLabel('PUBLICAR PARA MEMBROS').setStyle(ButtonStyle.Success).setEmoji('🚀').setDisabled(!(config.logChannel && config.category && config.staffRole)),
                        new ButtonBuilder().setCustomId('reset_ticket_cfg').setLabel('REINICIAR').setStyle(ButtonStyle.Danger).setEmoji('🗑️')
                    )
                ] 
            });
        });
    }
};