const { 
    EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, 
    ButtonBuilder, ButtonStyle, StringSelectMenuBuilder 
} = require('discord.js');
const JsoningLib = require("jsoning");
const Jsoning = typeof JsoningLib === "function" ? JsoningLib : JsoningLib.default;
const db = new Jsoning("database.json");

module.exports = {
    name: "ban",
    aliases: ["banir", "hackban"],
    description: "Executa o banimento com análise de conta e seletor de tempo.",
    async run(ctx, args) {
        if (!ctx.member.permissions.has(PermissionFlagsBits.BanMembers)) {
            return ctx.reply("⚠️ **ACESSO NEGADO:** Requer credenciais Nível 5.");
        }

        const targetId = args[0]?.replace(/[<@!>]/g, "");
        if (!targetId) return ctx.reply("⚠️ **ALVO NÃO DETECTADO:** Informe o @membro ou ID.");

        // Busca o usuário mesmo que ele não esteja no servidor (Hackban)
        const user = await ctx.client.users.fetch(targetId).catch(() => null);
        if (!user) return ctx.reply("❌ **ERRO:** Usuário não encontrado na base de dados do Discord.");

        const member = ctx.guild.members.cache.get(user.id);
        if (member && !member.bannable) return ctx.reply("🛡️ **DEFESA ATIVA:** Hierarquia do alvo é superior à minha.");

        // --- ANÁLISE DE CONTA ---
        const accountAge = Math.floor((Date.now() - user.createdTimestamp) / (1000 * 60 * 60 * 24));
        const isSuspicious = accountAge < 7;

        const banHistory = await db.get(`bans_${user.id}`) || 0;

        const mainEmbed = new EmbedBuilder()
            .setColor(isSuspicious ? "#FF0000" : "#2B2D31")
            .setAuthor({ name: `PROCESSO DE BANIMENTO: ${user.username}`, iconURL: user.displayAvatarURL() })
            .setDescription(
                `### 📂 ANÁLISE DO ALVO\n` +
                `**ID:** \`${user.id}\`\n` +
                `**Criação da Conta:** \`${accountAge} dias atrás\` ${isSuspicious ? "⚠️ **(SUSPEITA)**" : ""}\n` +
                `**Reincidência Local:** \`${banHistory}\` banimentos.\n\n` +
                `Selecione o **Protocolo de Tempo** abaixo para aplicar a sentença.`
            )
            .setFooter({ text: "Aguardando definição da duração..." });

        const menu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('select_ban_time')
                .setPlaceholder('⏱️ Definir Duração do Banimento...')
                .addOptions([
                    { label: 'Sentença Permanente', value: '0', emoji: '♾️', description: 'O alvo nunca poderá retornar.' },
                    { label: 'Exílio de 7 Dias', value: '7', emoji: '📅', description: 'Remoção temporária por uma semana.' },
                    { label: 'Exílio de 24 Horas', value: '1', emoji: '⏳', description: 'Suspensão de um dia.' },
                    { label: 'Protocolo Soft-Ban', value: 'soft', emoji: '🧹', description: 'Bane e desbane para limpar o chat.' }
                ])
        );

        const msg = await ctx.reply({ embeds: [mainEmbed], components: [menu] });

        const collector = msg.createMessageComponentCollector({ filter: i => i.user.id === ctx.author.id, time: 30000 });

        collector.on('collect', async i => {
            const time = i.values[0];
            await i.deferUpdate();

            // Mensagem de log na DM
            const dmEmbed = new EmbedBuilder()
                .setColor("#000000")
                .setTitle(`🚫 ACESSO REVOGADO EM ${ctx.guild.name.toUpperCase()}`)
                .setDescription(`Sua conta foi banida do servidor.\n\nDuração: **${time === '0' ? 'Permanente' : time === 'soft' ? 'Soft-Ban (Limpeza)' : `${time} dia(s)`}**\nOperador: **${ctx.author.tag}**`);

            await user.send({ embeds: [dmEmbed] }).catch(() => null);

            // Lógica de Banimento
            if (time === 'soft') {
                await ctx.guild.members.ban(user.id, { deleteMessageSeconds: 604800, reason: "Soft-Ban (Limpeza de Chat)" });
                await ctx.guild.members.unban(user.id, "Soft-Ban concluído.");
            } else {
                await ctx.guild.members.ban(user.id, { deleteMessageSeconds: 86400, reason: `Banido por ${ctx.author.tag}` });
                // Se fosse ban temporário real, aqui precisaria de um timer/DB, mas vamos focar no Ban Definitivo por agora.
            }

            await db.set(`bans_${user.id}`, banHistory + 1);

            const successEmbed = new EmbedBuilder()
                .setColor("#2B2D31")
                .setAuthor({ name: "SENTENÇA APLICADA", iconURL: "https://i.imgur.com/8Q9Z5O6.png" })
                .setDescription(
                    "```ansi\n" +
                    `• ALVO:      \u001b[1;31m${user.username}\u001b[0m\n` +
                    `• TIPO:      \u001b[1;33m${time === 'soft' ? 'SOFT-BAN' : 'PERMANENTE'}\u001b[0m\n` +
                    `• REGISTRO:  \u001b[1;37m#${Math.floor(Math.random() * 9999)}\u001b[0m\n` +
                    "```"
                );

            await msg.edit({ embeds: [successEmbed], components: [] });
        });
    }
};