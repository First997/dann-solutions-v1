const { EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const JsoningLib = require("jsoning");
const Jsoning = typeof JsoningLib === "function" ? JsoningLib : JsoningLib.default;
const db = new Jsoning("database.json");

module.exports = {
    name: "kick",
    aliases: ["expulsar", "exilar"],
    description: "Remove um indivíduo do setor com registro de reincidência.",
    async run(ctx, args) {
        if (!ctx.member.permissions.has(PermissionFlagsBits.KickMembers)) {
            return ctx.reply("⚠️ **ACESSO NEGADO:** Autorização de Nível 3 exigida.");
        }

        const target = ctx.mentions.members.first();
        if (!target) return ctx.reply("⚠️ **ALVO NÃO DETECTADO:** Mencione o infrator.");
        
        // Coleta o motivo e tenta identificar se há um link de imagem (prova)
        const reason = args.slice(1).join(" ") || "Violação dos protocolos de conduta.";
        const evidence = args.find(a => a.startsWith('http'));

        if (!target.kickable) return ctx.reply("❌ **ERRO DE HIERARQUIA:** Alvo inalcançável pelo sistema.");

        // --- BUSCA DE REINCIDÊNCIA ---
        const warnings = await db.get(`kicks_${target.id}`) || 0;

        const confirmEmbed = new EmbedBuilder()
            .setColor("#FFA500")
            .setAuthor({ name: "ORDEM DE EXÍLIO" })
            .setDescription(`Você está prestes a expulsar **${target.user.username}**.\n\n` +
                            `**Motivo:** ${reason}\n` +
                            `**Histórico:** Este usuário já foi expulso \`${warnings}\` vezes.`)
            .setFooter({ text: "Deseja assinar este mandado?" });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('confirm_kick').setLabel('ASSINAR MANDADO').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('cancel_kick').setLabel('ABORTAR').setStyle(ButtonStyle.Secondary)
        );

        const msg = await ctx.reply({ embeds: [confirmEmbed], components: [row] });

        const collector = msg.createMessageComponentCollector({ filter: i => i.user.id === ctx.author.id, time: 20000 });

        collector.on('collect', async i => {
            if (i.customId === 'cancel_kick') return i.update({ content: "❌ **OPERAÇÃO ABORTADA.**", embeds: [], components: [] });

            if (i.customId === 'confirm_kick') {
                // Atualiza DB de reincidência
                await db.set(`kicks_${target.id}`, warnings + 1);

                // Envia DM ao usuário
                const dmEmbed = new EmbedBuilder()
                    .setColor("#FF0000")
                    .setTitle(`⚠️ VOCÊ FOI EXILADO DE ${ctx.guild.name.toUpperCase()}`)
                    .setDescription(`**Motivo:** ${reason}\n\nSeu histórico de expulsões agora é de: \`${warnings + 1}\`.`)
                    .setFooter({ text: "Esta ação foi registrada no banco de dados governamental." });

                await target.send({ embeds: [dmEmbed] }).catch(() => null);
                await target.kick(reason);

                const finalEmbed = new EmbedBuilder()
                    .setColor("#2B2D31")
                    .setAuthor({ name: "SENTENÇA EXECUTADA", iconURL: target.user.displayAvatarURL() })
                    .setDescription(
                        "```ansi\n" +
                        `• INFRATOR:   \u001b[1;31m${target.user.username}\u001b[0m\n` +
                        `• HISTÓRICO:  \u001b[1;33m${warnings + 1} expulsões\u001b[0m\n` +
                        `• OPERADOR:   \u001b[1;34m${ctx.author.username}\u001b[0m\n` +
                        "```\n" +
                        `**Justificativa:**\n> ${reason}`
                    );

                if (evidence) finalEmbed.setImage(evidence);

                await i.update({ embeds: [finalEmbed], components: [] });
            }
        });
    }
};