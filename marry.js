const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const JsoningLib = require("jsoning");
const Jsoning = typeof JsoningLib === "function" ? JsoningLib : JsoningLib.default;
const db = new Jsoning("database.json");

module.exports = {
    name: "marry",
    aliases: ["casar", "marry", "uniao"],
    description: "Protocolo de união vitalícia com registro em cartório neural.",
    async run(ctx, args) {
        const author = ctx.author || ctx.user;
        const target = ctx.mentions.users.first();

        // --- VALIDAÇÕES ---
        if (!target) return ctx.reply("⚠️ **ALERTA:** Você precisa mencionar o parceiro(a) para iniciar o registro.");
        if (target.id === author.id) return ctx.reply("❌ **NEGADO:** O sistema não permite auto-união.");
        if (target.bot) return ctx.reply("🤖 **ERRO:** IAs não possuem contratos de afeto biológico.");

        const authorPartner = await db.get(`marry_${author.id}`);
        const targetPartner = await db.get(`marry_${target.id}`);

        if (authorPartner) return ctx.reply(`🚨 **ESCÂNDALO:** Você já possui um vínculo ativo com <@${authorPartner}>.`);
        if (targetPartner) return ctx.reply(`🚨 **IMPEDIMENTO:** ${target.username} já possui um contrato ativo.`);

        // --- ETAPA 1: O INVESTIMENTO ---
        const ringEmbed = new EmbedBuilder()
            .setColor("#2B2D31")
            .setAuthor({ name: "MINISTÉRIO DA UNIÃO", iconURL: "https://i.imgur.com/8Q9Z5O6.png" })
            .setTitle("💎 SELEÇÃO DE PRESTÍGIO")
            .setDescription(
                "Escolha o nível de blindagem da sua união civil:\n\n" +
                "**🥈 PRATA** - Registro básico de convivência.\n" +
                "**🥇 OURO** - Destaque dourado e prioridade de suporte.\n" +
                "**💎 DIAMANTE** - Blindagem total, ID único e status de elite."
            );

        const rowRings = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('r_prata').setLabel('Prata').setStyle(ButtonStyle.Secondary).setEmoji('🥈'),
            new ButtonBuilder().setCustomId('r_ouro').setLabel('Ouro').setStyle(ButtonStyle.Secondary).setEmoji('🥇'),
            new ButtonBuilder().setCustomId('r_diamante').setLabel('Diamante').setStyle(ButtonStyle.Secondary).setEmoji('💎')
        );

        const initialMsg = await ctx.reply({ embeds: [ringEmbed], components: [rowRings], fetchReply: true });

        const ringCollector = initialMsg.createMessageComponentCollector({
            filter: i => i.user.id === author.id,
            time: 30000,
            max: 1
        });

        ringCollector.on('collect', async rInt => {
            const ringType = rInt.customId.split('_')[1];
            const color = ringType === 'prata' ? '#BDC3C7' : ringType === 'ouro' ? '#F1C40F' : '#00EAD3';
            const certID = `REG-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
            let witness = "Ninguém"; // Sistema de testemunha iniciado
            
            // --- ETAPA 2: O CONTRATO (Injetando lógica de testemunha visual) ---
            const renderPropose = () => {
                return new EmbedBuilder()
                .setColor(color)
                .setTitle(`📝 CONTRATO DE UNIÃO - ID: ${certID}`)
                .setDescription(
                    `Eu, **${author.username}**, solicito a guarda compartilhada da alma de **${target.username}**.\n\n` +
                    "```ansi\n" +
                    "\u001b[1;37mCLÁUSULAS DE ELITE:\u001b[0m\n" +
                    `• \u001b[1;32mSincronização de perfis sociais.\u001b[0m\n` +
                    `• \u001b[1;32mPadrinho/Testemunha: ${witness}\u001b[0m\n` +
                    `• \u001b[1;31mDivórcio sujeito a exposição pública.\u001b[0m\n` +
                    "```"
                )
                .setThumbnail(target.displayAvatarURL())
                .setFooter({ text: "Aguardando assinatura da contraparte e testemunhas..." });
            };

            const rowPropose = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('accept').setLabel('Assinar Contrato').setStyle(ButtonStyle.Success).setEmoji('🖋️'),
                new ButtonBuilder().setCustomId('deny').setLabel('Recusar').setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('witness_join').setLabel('Ser Testemunha').setStyle(ButtonStyle.Secondary).setEmoji('🤝')
            );

            await rInt.update({ embeds: [renderPropose()], components: [rowPropose] });

            const mainCollector = initialMsg.createMessageComponentCollector({
                time: 60000
            });

            mainCollector.on('collect', async mInt => {
                // Lógica de Testemunha (Qualquer um pode clicar menos os noivos)
                if (mInt.customId === 'witness_join') {
                    if (mInt.user.id === author.id || mInt.user.id === target.id) {
                        return mInt.reply({ content: "❌ Você não pode ser testemunha da sua própria união.", ephemeral: true });
                    }
                    witness = mInt.user.username;
                    return mInt.update({ embeds: [renderPropose()] });
                }

                // Lógica de Aceite (Apenas o alvo)
                if (mInt.user.id !== target.id) {
                    if (mInt.customId === 'accept' || mInt.customId === 'deny') {
                        return mInt.reply({ content: "⚠️ Você não tem autoridade para assinar este contrato.", ephemeral: true });
                    }
                    return;
                }

                if (mInt.customId === 'accept') {
                    const timestamp = Date.now();
                    
                    // Salvando TUDO na Database (Expandido com Testemunha e XP)
                    await db.set(`marry_${author.id}`, target.id);
                    await db.set(`marry_${target.id}`, author.id);
                    await db.set(`marry_date_${author.id}`, timestamp);
                    await db.set(`marry_type_${author.id}`, ringType);
                    await db.set(`marry_id_${author.id}`, certID);
                    await db.set(`marry_stability_${author.id}`, 100);
                    await db.set(`marry_witness_${author.id}`, witness);
                    await db.set(`marry_love_xp_${author.id}`, 0); // Iniciando sistema de XP

                    const finalEmbed = new EmbedBuilder()
                        .setColor(color)
                        .setAuthor({ name: "UNIÃO REGISTRADA • SISTEMA DE ELITE", iconURL: "https://i.imgur.com/8Q9Z5O6.png" })
                        .setTitle(`💍 ${author.username.toUpperCase()} & ${target.username.toUpperCase()}`)
                        .setDescription(
                            "O vínculo foi selado, criptografado e inserido na blockchain do servidor.\n\n" +
                            `**📂 ID Digital:** \`${certID}\`\n` +
                            `**🤝 Testemunha:** \`${witness}\`\n` +
                            `**🗓️ Início:** <t:${Math.floor(timestamp / 1000)}:R>\n` +
                            `**🏆 Nível:** ${ringType.toUpperCase()}\n\n` +
                            "**ESTABILIDADE DO VÍNCULO:**\n" +
                            "```ansi\n\u001b[1;32m[▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬] 100%\u001b[0m\n```"
                        )
                        .setImage("https://i.imgur.com/5u6kXkP.png")
                        .setFooter({ text: "Use d!perfil para ver seu novo status civil." });

                    await mInt.update({ content: `🔔 **ALERTA:** Nova união detectada no sistema.`, embeds: [finalEmbed], components: [] });
                    mainCollector.stop();
                } else if (mInt.customId === 'deny') {
                    await mInt.update({ content: `💔 **ABORTADO:** ${target.username} negou a assinatura do contrato.`, embeds: [], components: [] });
                    mainCollector.stop();
                }
            });
        });

        ringCollector.on('end', collected => {
            if (collected.size === 0) initialMsg.delete().catch(() => null);
        });
    }
};