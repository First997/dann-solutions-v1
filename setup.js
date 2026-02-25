const { 
    EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, 
    ButtonBuilder, ButtonStyle, ChannelType, ComponentType 
} = require('discord.js');
const JsoningLib = require("jsoning");
const Jsoning = typeof JsoningLib === "function" ? JsoningLib : JsoningLib.default;
const db = new Jsoning("database.json");

module.exports = {
    name: "setup",
    description: "Configura os protocolos de segurança e logs do servidor.",
    async run(ctx) {
        const author = ctx.author || ctx.user;
        const guild = ctx.guild;

        // --- PROTOCOLO DE ACESSO ---
        if (!ctx.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return ctx.reply({ 
                content: "❌ **ACESSO NEGADO:** Este terminal é restrito a administradores de Nível 5.", 
                ephemeral: true 
            });
        }

        // --- INTERFACE DE BOOT ---
        const setupEmbed = new EmbedBuilder()
            .setColor("#2B2D31")
            .setAuthor({ name: `CENTRAL DE SEGURANÇA: ${guild.name.toUpperCase()}`, iconURL: guild.iconURL() })
            .setTitle("🖥️ Painel de Configuração de Defesa")
            .setDescription(
                "Bem-vindo ao centro de controle. Abaixo você pode gerenciar os módulos de proteção ativa.\n\n" +
                "**Módulos Disponíveis:**\n" +
                "> 🛰️ **Logs de Auditoria:** Canal onde as infrações são reportadas.\n" +
                "> 🛡️ **Anti-Link/Invite:** Filtro de mensagens maliciosas.\n" +
                "> ⚪ **Whitelist:** Canais imunes à proteção."
            )
            .addFields(
                { name: "📊 Status Atual", value: "```Sincronizando com banco de dados...```", inline: false }
            )
            .setFooter({ text: "Dann Solutions Security System • v4.0" })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('set_logs').setLabel('Configurar Logs').setStyle(ButtonStyle.Primary).setEmoji('🛰️'),
            new ButtonBuilder().setCustomId('toggle_antilink').setLabel('Módulo Anti-Link').setStyle(ButtonStyle.Secondary).setEmoji('🛡️'),
            new ButtonBuilder().setCustomId('setup_finish').setLabel('Finalizar').setStyle(ButtonStyle.Success).setEmoji('✅')
        );

        const msg = await ctx.reply({ embeds: [setupEmbed], components: [row], fetchReply: true });

        // --- COLETOR DE CONFIGURAÇÃO ---
        const collector = msg.createMessageComponentCollector({
            filter: i => i.user.id === author.id,
            time: 300000
        });

        collector.on('collect', async i => {
            // Lógica para Configurar Logs
            if (i.customId === 'set_logs') {
                const logEmbed = new EmbedBuilder()
                    .setColor("#3498DB")
                    .setTitle("🛰️ Seleção de Canal de Auditoria")
                    .setDescription("Por favor, mencione o canal (ex: #logs) onde deseja receber os relatórios de infração.");

                await i.update({ embeds: [logEmbed], components: [] });

                const filter = m => m.author.id === author.id && m.mentions.channels.first();
                const msgCollector = ctx.channel.createMessageCollector({ filter, time: 30000, max: 1 });

                msgCollector.on('collect', async m => {
                    const channel = m.mentions.channels.first();
                    if (channel.type !== ChannelType.GuildText) return m.reply("❌ O canal precisa ser do tipo Texto.");

                    await db.set(`log_channel_${guild.id}`, channel.id);
                    m.delete().catch(() => null);

                    const successLog = new EmbedBuilder()
                        .setColor("#2ECC71")
                        .setDescription(`✅ **SUCESSO:** O canal ${channel} foi definido como a base de auditoria.`);
                    
                    await msg.edit({ embeds: [successLog], components: [row] });
                });
            }

            // Lógica para Alternar Anti-Link
            if (i.customId === 'toggle_antilink') {
                const current = await db.get(`antilink_${guild.id}`) || false;
                await db.set(`antilink_${guild.id}`, !current);

                const toggleEmbed = new EmbedBuilder()
                    .setColor(!current ? "#2ECC71" : "#E74C3C")
                    .setDescription(`🛡️ **MODULO ATUALIZADO:** O Anti-Link agora está **${!current ? "ATIVADO" : "DESATIVADO"}**.`);
                
                await i.update({ embeds: [toggleEmbed], components: [row] });
            }

            if (i.customId === 'setup_finish') {
                await i.update({ content: "✅ **SISTEMA CONFIGURADO E PRONTO PARA OPERAÇÃO.**", embeds: [], components: [] });
                collector.stop();
            }
        });
    }
};