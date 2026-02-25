const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const JsoningLib = require("jsoning");
const Jsoning = typeof JsoningLib === "function" ? JsoningLib : JsoningLib.default;
const db = new Jsoning("database.json");

module.exports = {
    name: "divorce",
    aliases: ["divorciar", "separar", "rescisao"],
    description: "Encerra um contrato matrimonial com todas as penalidades aplicáveis.",
    async run(ctx, args) {
        const author = ctx.author || ctx.user;
        const partnerId = await db.get(`marry_${author.id}`);

        if (!partnerId) return ctx.reply("⚠️ **ERRO:** Você não possui nenhum vínculo ativo no sistema para rescindir.");

        // Verificar se está em Cooldown de Luto (Evita casar/separar toda hora)
        const luto = await db.get(`luto_${author.id}`);
        if (luto && luto > Date.now()) {
            return ctx.reply(`⏳ **SISTEMA EM LUTO:** Você ainda está processando o último divórcio. Aguarde <t:${Math.floor(luto/1000)}:R>.`);
        }

        const certID = await db.get(`marry_id_${author.id}`) || "DESCONHECIDO";
        const marryType = await db.get(`marry_type_${author.id}`) || "Padrão";

        // --- ETAPA 1: ESCOLHER O MOTIVO ---
        const motivoEmbed = new EmbedBuilder()
            .setColor("#2B2D31")
            .setTitle("💔 PROTOCOLO DE SEPARAÇÃO")
            .setDescription("Antes de incinerar o contrato, selecione o motivo oficial da rescisão para os arquivos do servidor:");

        const menuMotivo = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('select_motivo')
                .setPlaceholder('Selecione o motivo do divórcio...')
                .addOptions([
                    { label: 'Incompatibilidade de Gênio', value: 'incompatibilidade', emoji: '🧠' },
                    { label: 'Abandono de Sistema', value: 'abandono', emoji: '🏃' },
                    { label: 'Traição de Dados', value: 'traicao', emoji: '🐍' },
                    { label: 'Fim do Prazo de Validade', value: 'fim', emoji: '⌛' },
                ])
        );

        const initialMsg = await ctx.reply({ embeds: [motivoEmbed], components: [menuMotivo], fetchReply: true });

        const collector = initialMsg.createMessageComponentCollector({ filter: i => i.user.id === author.id, time: 60000 });

        collector.on('collect', async i => {
            if (i.customId === 'select_motivo') {
                const motivoMap = {
                    'incompatibilidade': '🧠 Incompatibilidade de Gênio',
                    'abandono': '🏃 Abandono de Sistema',
                    'traicao': '🐍 Traição de Dados',
                    'fim': '⌛ Fim do Prazo de Validade'
                };
                const motivoFinal = motivoMap[i.values[0]];

                // --- ETAPA 2: CONFIRMAÇÃO FINAL ---
                const confirmEmbed = new EmbedBuilder()
                    .setColor("#FF0000")
                    .setAuthor({ name: "AVISO CRÍTICO DE RESCISÃO", iconURL: "https://i.imgur.com/8Q9Z5O6.png" })
                    .setDescription(
                        `Deseja realmente triturar a certidão **#${certID}**?\n\n` +
                        "**DADOS DA RESCISÃO:**\n" +
                        "```ansi\n" +
                        `• Motivo: \u001b[1;33m${motivoFinal}\u001b[0m\n` +
                        `• Parceiro: \u001b[1;37m<@${partnerId}>\u001b[0m\n` +
                        `• Penalidade: \u001b[1;31mLuto de 1 hora\u001b[0m\n` +
                        "```"
                    );

                const buttons = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('confirm').setLabel('Assinar Divórcio').setStyle(ButtonStyle.Danger).setEmoji('🖋️'),
                    new ButtonBuilder().setCustomId('cancel').setLabel('Desistir').setStyle(ButtonStyle.Success)
                );

                await i.update({ embeds: [confirmEmbed], components: [buttons] });

                const buttonCollector = initialMsg.createMessageComponentCollector({ filter: b => b.user.id === author.id, time: 30000, max: 1 });

                buttonCollector.on('collect', async b => {
                    if (b.customId === 'confirm') {
                        // Limpeza total da DB em ambos os lados
                        const targets = [author.id, partnerId];
                        for (const id of targets) {
                            await db.delete(`marry_${id}`);
                            await db.delete(`marry_date_${id}`);
                            await db.delete(`marry_type_${id}`);
                            await db.delete(`marry_id_${id}`);
                            await db.delete(`marry_witness_${id}`);
                            await db.delete(`marry_stability_${id}`);
                            // Adicionar Cooldown de Luto (1 hora)
                            await db.set(`luto_${id}`, Date.now() + 3600000);
                        }

                        const finalEmbed = new EmbedBuilder()
                            .setColor("#000000")
                            .setTitle("💀 CONTRATO INCINERADO")
                            .setDescription(`A união entre **${author.username}** e <@${partnerId}> foi oficialmente encerrada.\n\n**Motivo:** \`${motivoFinal}\`\n**Status:** Ambos estão em luto por 1 hora.`)
                            .setImage("https://i.imgur.com/F3P50qH.png") // Uma imagem de papel queimando ou algo dark
                            .setFooter({ text: "Registro removido do Cartório Neural." });

                        await b.update({ content: "📢 **ANÚNCIO:** O divórcio foi processado com sucesso.", embeds: [finalEmbed], components: [] });
                    } else {
                        await b.update({ content: "✅ **CANCELADO:** Você decidiu dar mais uma chance ao amor.", embeds: [], components: [] });
                    }
                });
            }
        });
    }
};