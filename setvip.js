const { EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const JsoningLib = require("jsoning");
const Jsoning = typeof JsoningLib === "function" ? JsoningLib : JsoningLib.default;
const db = new Jsoning("database.json");

module.exports = {
    name: "setvip",
    aliases: ["addvip", "darvip"],
    description: "Atribui o status de membro VIP a um usuário.",
    async run(ctx, args) {
        const author = ctx.author || ctx.user;
        const target = ctx.mentions.members.first();
        const client = ctx.client;

        // --- SEGURANÇA DE ALTO NÍVEL ---
        if (!ctx.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return ctx.reply({ content: "⛔ **ACESSO NEGADO:** Apenas administradores do alto comando podem gerenciar planos VIP.", ephemeral: true });
        }

        if (!target) {
            return ctx.reply({ content: "⚠️ **SINTAXE:** Mencione o usuário que receberá os benefícios. Ex: `d!setvip @user`.", ephemeral: true });
        }

        // --- CONFIGURAÇÃO DO CARGO ---
        const VIP_ROLE_ID = "ID_DO_SEU_CARGO_AQUI"; // SUBSTITUA PELO ID REAL
        const role = ctx.guild.roles.cache.get(VIP_ROLE_ID);

        if (!role) {
            return ctx.reply({ content: "🚨 **ERRO CRÍTICO:** O cargo VIP não foi localizado na base de dados do servidor. Verifique o ID no código.", ephemeral: true });
        }

        // --- EMBED DE PROCESSAMENTO ---
        const processingEmbed = new EmbedBuilder()
            .setColor("#FFD700")
            .setAuthor({ name: "SISTEMA DE PAGAMENTOS E PRIVILÉGIOS", iconURL: "https://i.imgur.com/v0S4p7B.png" })
            .setTitle("💎 Upgrade de Conta: Membro VIP")
            .setDescription(
                `Você está prestes a conceder privilégios VIP para **${target.user.username}**.\n\n` +
                "**Benefícios Vinculados:**\n" +
                "• Acesso a canais exclusivos de elite.\n" +
                "• Prioridade em suporte e eventos.\n" +
                "• Identificação visual diferenciada na lista de membros.\n\n" +
                `**Operador Responsável:** \`${author.tag}\``
            )
            .setFooter({ text: "Deseja confirmar a transação de status?" });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('confirm_vip').setLabel('Confirmar Upgrade').setStyle(ButtonStyle.Primary).setEmoji('💳'),
            new ButtonBuilder().setCustomId('cancel_vip').setLabel('Cancelar').setStyle(ButtonStyle.Secondary)
        );

        const msg = await ctx.reply({ embeds: [processingEmbed], components: [row] });

        const collector = msg.createMessageComponentCollector({
            filter: i => i.user.id === author.id,
            time: 30000,
            max: 1
        });

        collector.on('collect', async i => {
            if (i.customId === 'confirm_vip') {
                try {
                    await target.roles.add(role);
                    await db.set(`vip_status_${target.id}`, {
                        active: true,
                        since: Date.now(),
                        grantedBy: author.id
                    });

                    const successEmbed = new EmbedBuilder()
                        .setColor("#2ECC71")
                        .setAuthor({ name: "UPGRADE CONCLUÍDO", iconURL: target.user.displayAvatarURL() })
                        .setTitle("💎 BEM-VINDO À ELITE")
                        .setDescription(`Parabéns ${target}! Seu status foi atualizado para **VIP**. Seus benefícios já estão ativos no servidor.`)
                        .addFields({ name: "📅 Data de Ativação", value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true })
                        .setFooter({ text: "Dann Solutions VIP Management" });

                    await i.update({ embeds: [successEmbed], components: [] });
                } catch (err) {
                    await i.update({ content: "❌ **ERRO DE PERMISSÃO:** Não consegui adicionar o cargo ao usuário. Verifique se meu cargo está acima do cargo VIP.", embeds: [], components: [] });
                }
            } else {
                await i.update({ content: "❌ Operação cancelada pelo administrador.", embeds: [], components: [] });
            }
        });
    }
};