const { EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    name: "clear",
    aliases: ["cl", "limpar", "purge", "vaporizar"],
    description: "Vaporiza mensagens com filtros, confirmação e auditoria de elite.",
    async run(ctx, args) {
        // Garantindo que 'message' seja definido para evitar o ReferenceError
        const message = ctx;

        if (!ctx.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return ctx.reply("⚠️ **ACESSO NEGADO:** Autorização de Nível 4 exigida.");
        }

        const amount = parseInt(args[0]);
        const isSilent = args.includes('--s');
        const target = ctx.mentions?.users?.first();
        const operationID = Math.random().toString(36).substring(2, 8).toUpperCase();

        if (isNaN(amount) || amount < 1 || amount > 100) {
            return ctx.reply("⚠️ **ERRO DE SINTAXE:** Use `d!clear [1-100]`. Ex: `d!clear 50 --s`.");
        }

        const confirmEmbed = new EmbedBuilder()
            .setColor("#FFD700")
            .setAuthor({ name: `ORDEM DE PURGAÇÃO: #${operationID}` })
            .setDescription(`**Operador:** <@${ctx.author.id}>\n**Alvo:** ${target ? `<@${target.id}>` : "Setor Geral"}\n**Quantidade:** ${amount} mensagens.\n\n` +
                            "```ansi\n\u001b[1;31mATENÇÃO:\u001b[0m Esta ação é irreversível nos bancos de dados locais.\n```")
            .setFooter({ text: "Aguardando autorização do moderador..." });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('confirm_clear').setLabel('EXECUTAR').setStyle(ButtonStyle.Danger).setEmoji('☢️'),
            new ButtonBuilder().setCustomId('cancel_clear').setLabel('ABORTAR').setStyle(ButtonStyle.Secondary)
        );

        const msg = await ctx.reply({ embeds: [confirmEmbed], components: [row] });

        const collector = msg.createMessageComponentCollector({ 
            filter: i => i.user.id === ctx.author.id, 
            time: 20000 
        });

        collector.on('collect', async i => {
            if (i.customId === 'cancel_clear') {
                return i.update({ content: "❌ **OPERAÇÃO CANCELADA PELO USUÁRIO.**", embeds: [], components: [] }).catch(() => null);
            }

            if (i.customId === 'confirm_clear') {
                // Feedback visual imediato
                await i.update({ content: "⏳ **DESFRAGMENTANDO SETOR...**", embeds: [], components: [] }).catch(() => null);

                try {
                    // Busca as mensagens
                    let messages = await ctx.channel.messages.fetch({ limit: amount });

                    // --- TRAVA DE SEGURANÇA: NÃO APAGAR A PRÓPRIA MENSAGEM DO COMANDO ---
                    // Isso evita o erro 'Unknown Message' ao tentar editar o relatório depois
                    messages = messages.filter(m => m.id !== msg.id);

                    // Filtro por usuário alvo
                    if (target) {
                        messages = messages.filter(m => m.author.id === target.id);
                    }

                    // Amostra para o Log
                    const sample = messages.first(3).map(m => `[${m.author.username}]: ${m.content.slice(0, 30)}...`).join('\n') || "Mídias/Embeds";

                    // Executa a limpeza
                    const deleted = await ctx.channel.bulkDelete(messages, true);

                    // Se for modo silencioso, apaga a mensagem de status e encerra
                    if (isSilent) {
                        return msg.delete().catch(() => null);
                    }

                    // Monta o Relatório Final (Preservando sua ANSI)
                    const reportEmbed = new EmbedBuilder()
                        .setColor("#2B2D31")
                        .setAuthor({ name: "SANEAMENTO CONCLUÍDO", iconURL: "https://i.imgur.com/8Q9Z5O6.png" })
                        .setTitle(`🆔 LOG: ${operationID}`)
                        .setDescription(
                            "**RESUMO DA LIMPEZA:**\n" +
                            "```ansi\n" +
                            `• MENSAGENS:   \u001b[1;32m${deleted.size}\u001b[0m\n` +
                            `• AMOSTRA:     \u001b[1;30m${sample.replace(/\n/g, '\n  ')}\u001b[0m\n` +
                            `• STATUS:      \u001b[1;37mSETOR ESTÁVEL\u001b[0m\n` +
                            "```"
                        )
                        .setFooter({ text: "Logs arquivados temporariamente." });

                    // Edita a mensagem para o relatório (com trava de erro)
                    await msg.edit({ content: null, embeds: [reportEmbed], components: [] }).catch(() => null);
                    
                    // Auto-delete do relatório em 7 segundos
                    setTimeout(() => {
                        msg.delete().catch(() => null);
                    }, 7000);

                } catch (err) {
                    console.error("Erro no sistema de Clear:", err);
                    await msg.edit({ content: "❌ **ERRO CRÍTICO:** O protocolo falhou ao vaporizar as mensagens.", embeds: [], components: [] }).catch(() => null);
                }
            }
        });

        collector.on('end', (collected, reason) => {
            if (reason === 'time' && collected.size === 0) {
                msg.edit({ content: "⚠️ **TEMPO ESGOTADO:** Operação abortada automaticamente.", embeds: [], components: [] }).catch(() => null);
                setTimeout(() => msg.delete().catch(() => null), 5000);
            }
        });

        // Retorno nulo para o seu index.js ignorar o auto-delete global de 15s
        return null;
    }
};