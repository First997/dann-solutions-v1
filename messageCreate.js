const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const JsoningLib = require("jsoning");
const Jsoning = typeof JsoningLib === "function" ? JsoningLib : JsoningLib.default;
const db = new Jsoning("database.json");

/**
 * 🛡️ SISTEMA DE PROTEÇÃO DE PERÍMETRO (ANTI-LINK)
 * Este módulo não é um comando, é um gatilho de monitoramento.
 */
module.exports = async (client, message) => {
    // 1. Ignorar bots e DMs
    if (message.author.bot || !message.guild) return;

    // 2. Ignorar Administradores (Eles têm passe livre)
    if (message.member?.permissions.has(PermissionFlagsBits.Administrator)) return;

    // 3. Verificar se o sistema está ligado no banco de dados para este servidor
    const isEnabled = await db.get(`antilink_${message.guild.id}`);
    if (!isEnabled) return;

    // 4. Expressões Regulares de Detecção (Elite)
    const filters = {
        invites: /(https?:\/\/)?(www\.)?(discord\.(gg|io|me|li)|discordapp\.com\/invite)\/.+/i,
        links: /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)/
    };

    if (filters.invites.test(message.content) || filters.links.test(message.content)) {
        
        try {
            // AÇÃO: Deletar a ameaça
            await message.delete();

            // AVISO: Notificar o infrator com design elegante
            const warning = await message.channel.send({
                content: `⚠️ **SEGURANÇA ATIVA:** ${message.author}, o envio de links externos é restrito neste setor.`
            });
            setTimeout(() => warning.delete().catch(() => null), 6000);

            // LOGS: Enviar para a auditoria se houver canal configurado
            const logChannelId = await db.get(`log_channel_${message.guild.id}`);
            const logChannel = message.guild.channels.cache.get(logChannelId);

            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setColor("#FF0000")
                    .setAuthor({ name: "INTERCEPTAÇÃO DE DADOS", iconURL: message.author.displayAvatarURL() })
                    .setTitle("🚨 Violação de Protocolo Detectada")
                    .setThumbnail("https://i.imgur.com/8Q9Z5O6.png")
                    .addFields(
                        { name: "👤 Infrator", value: `${message.author} (\`${message.author.id}\`)`, inline: true },
                        { name: "📍 Local", value: `${message.channel}`, inline: true },
                        { name: "📄 Conteúdo Removido", value: `\`\`\`${message.content.slice(0, 1000)}\`\`\`` }
                    )
                    .setFooter({ text: "Sistema de Proteção Dann Solutions" })
                    .setTimestamp();

                const actionRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`ban_${message.author.id}`)
                        .setLabel('Banir Usuário')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setLabel('Ver Perfil')
                        .setURL(`https://discord.com/users/${message.author.id}`)
                        .setStyle(ButtonStyle.Link)
                );

                await logChannel.send({ embeds: [logEmbed], components: [actionRow] });
            }
        } catch (error) {
            console.log(`[ANTI-LINK ERROR] Falha ao processar: ${error.message}`.red);
        }
    }
};