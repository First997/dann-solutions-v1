const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: "unmute",
    aliases: ["desmutar", "reabilitar", "untimeout"],
    description: "Restaura a frequência de transmissão de um indivíduo.",
    async run(ctx, args) {
        if (!ctx.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return ctx.reply("⚠️ **ACESSO NEGADO:** Requer credenciais Nível 2.");
        }

        const target = ctx.mentions.members.first() || ctx.guild.members.cache.get(args[0]);
        if (!target) return ctx.reply("⚠️ **ALVO NÃO DETECTADO:** Informe quem deve ser reabilitado.");

        if (!target.communicationDisabledUntilTimestamp) {
            return ctx.reply("ℹ️ **INFO:** Este indivíduo não está sob isolamento de sinal.");
        }

        try {
            await target.timeout(null); // Remove o timeout

            const unmuteEmbed = new EmbedBuilder()
                .setColor("#2B2D31")
                .setAuthor({ name: "FREQUÊNCIA RESTAURADA", iconURL: target.user.displayAvatarURL() })
                .setDescription(
                    "O acesso às camadas de interação foi restabelecido.\n\n" +
                    "**DADOS DA REABILITAÇÃO:**\n" +
                    "```ansi\n" +
                    `• USUÁRIO:    \u001b[1;34m${target.user.username}\u001b[0m\n` +
                    `• STATUS:     \u001b[1;32mONLINE\u001b[0m\n` +
                    `• OPERADOR:   \u001b[1;37m${ctx.author.username}\u001b[0m\n` +
                    "```"
                )
                .setFooter({ text: "Protocolo de Justiça Dann Solutions" });

            await ctx.reply({ embeds: [unmuteEmbed] });

            // Aviso na DM do usuário
            const dmEmbed = new EmbedBuilder()
                .setColor("#00FF00")
                .setTitle("🔊 SINAL RESTAURADO")
                .setDescription(`Seu isolamento no servidor **${ctx.guild.name}** foi revogado precocemente por um administrador.`);
            
            await target.send({ embeds: [dmEmbed] }).catch(() => null);

        } catch (err) {
            ctx.reply("❌ **ERRO CRÍTICO:** Falha ao tentar restaurar o sinal do alvo.");
        }
    }
};