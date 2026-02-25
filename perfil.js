const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, time } = require('discord.js');
const JsoningLib = require("jsoning");
const Jsoning = typeof JsoningLib === "function" ? JsoningLib : JsoningLib.default;
const db = new Jsoning("database.json");

module.exports = {
    name: "perfil",
    aliases: ["p", "profile", "dossie", "me"],
    description: "Exibe o Dossiê de Elite do cidadão com detalhes matrimoniais e financeiros em tempo real.",
    async run(ctx, args) {
        const author = ctx.author || ctx.user;
        const user = ctx.mentions.users.first() || ctx.author || ctx.user;
        const member = ctx.guild.members.cache.get(user.id);
        
        const userFetch = await ctx.client.users.fetch(user.id, { force: true });

        // --- BUSCA DE DADOS NA DATABASE ---
        const partnerId = await db.get(`marry_${user.id}`);
        let marryDate = await db.get(`marry_date_${user.id}`);
        const marryType = await db.get(`marry_type_${user.id}`) || await db.get(`marry_type_${partnerId}`) || "Padrão";
        const marryId = await db.get(`marry_id_${user.id}`) || await db.get(`marry_id_${partnerId}`);
        const witness = await db.get(`marry_witness_${user.id}`) || await db.get(`marry_witness_${partnerId}`);
        const stability = await db.get(`marry_stability_${user.id}`) ?? 100;
        
        const loveXP = await db.get(`marry_love_xp_${user.id}`) || 0;
        const lastUserLove = await db.get(`last_user_love_${user.id}`);

        // --- BUSCA DE DADOS FINANCEIROS ---
        const money = await db.get(`money_${user.id}`) || 0;
        const streak = await db.get(`streak_${user.id}`) || 0;
        
        const isProponent = await db.get(`marry_type_${user.id}`) ? true : false;

        // --- CORREÇÃO DE DATA REAL-TIME ---
        if (partnerId && (!marryDate || marryDate < 1000000000000)) {
            marryDate = Date.now();
            await db.set(`marry_date_${user.id}`, marryDate);
        }

        // --- DEFINIÇÃO DE CORES E EMOJIS ---
        const ringEmoji = marryType === 'prata' ? '🥈' : marryType === 'ouro' ? '🥇' : marryType === 'diamante' ? '💎' : '💍';
        const color = marryType === 'diamante' ? '#00EAD3' : (userFetch.hexAccentColor || "#2B2D31");

        // --- CONSTRUÇÃO DO BLOCO DE CASAMENTO ---
        let marrySection = "```ansi\n\u001b[1;30mESTADO CIVIL: DISPONÍVEL NA REDE\u001b[0m\n```";
        
        if (partnerId) {
            const unix = Math.floor(marryDate / 1000);
            
            marrySection = 
                `**💍 Cônjuge:** <@${partnerId}>\n` +
                `**🎭 Papel:** \`${isProponent ? "PROPONENTE (AUTOR)" : "RECEPTÁCULO (ACEITOU)"}\`\n` +
                `**✨ Aliança:** ${ringEmoji} ${marryType.toUpperCase()}\n` +
                `**💖 Love XP:** \`${loveXP.toLocaleString()}\` XP\n` +
                `**🆔 Certidão:** \`${marryId || "CERT-OFFICIAL"}\`\n` +
                `**🤝 Testemunha:** \`${witness || "Sem registro"}\`\n` +
                `**📅 União em:** <t:${unix}:F>\n` +
                `**⏳ Tempo decorrido:** <t:${unix}:R>\n\n` +
                "**ESTABILIDADE VITAL:**\n" +
                `\`\`\`ansi\n\u001b[1;32m[${"█".repeat(Math.floor(stability/10))}${" ".repeat(10 - Math.floor(stability/10))}] ${stability}%\u001b[0m\n\`\`\``;
        }

        // --- EMBED DE IDENTIDADE (HOME) ---
        const homeEmbed = new EmbedBuilder()
            .setColor(color)
            .setAuthor({ name: `DOSSIÊ GOVERNAMENTAL • REGISTRO DE ELITE`, iconURL: "https://i.imgur.com/8Q9Z5O6.png" })
            .setTitle(`🪪 IDENTIDADE DE: ${user.globalName || user.username}`)
            .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 1024 }))
            .setDescription(
                `### 📂 REGISTROS CIVIS\n${marrySection}\n` +
                `### 📊 ATIVOS FINANCEIROS\n` +
                `**Saldo:** \`$ ${money.toLocaleString()}\` | **Streak:** \`${streak}d\`\n\n` +
                `### ⚙️ ATRIBUTOS DO SISTEMA\n` +
                `**Badge Primária:** ${member.roles.highest}\n` +
                `**Entrada no Setor:** <t:${Math.floor(member.joinedTimestamp / 1000)}:D>\n` +
                `**Status Global:** ${partnerId ? `💍 Vinculado a <@${partnerId}>` : "🟢 Livre para Negociações"}\n` +
                `${lastUserLove ? `**Último Afeto por:** <@${lastUserLove}>` : ""}`
            )
            .addFields(
                { name: "🧬 Biometria", value: `**Tag:** \`${user.tag}\`\n**ID:** \`${user.id}\``, inline: true },
                { name: "🌐 Rede", value: `**Servidor:** \`${ctx.guild.name}\`\n**Status:** \u001b[1;32mATIVO\u001b[0m`, inline: true }
            )
            .setImage(userFetch.bannerURL({ size: 1024 }) || "https://i.imgur.com/p8b7Y7P.png")
            .setFooter({ text: `Consultado por ${author.username}`, iconURL: author.displayAvatarURL() })
            .setTimestamp();

        // --- COMPONENTES ---
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('go_home').setLabel('Dossiê').setStyle(ButtonStyle.Primary).setEmoji('🪪'),
            new ButtonBuilder().setCustomId('go_media').setLabel('Mídia').setStyle(ButtonStyle.Secondary).setEmoji('📸'),
            new ButtonBuilder().setCustomId('gen_qr').setLabel('QR-ID').setStyle(ButtonStyle.Secondary).setEmoji('📲')
        );

        const msg = await ctx.reply({ embeds: [homeEmbed], components: [row], fetchReply: true });

        const collector = msg.createMessageComponentCollector({ filter: i => i.user.id === author.id, time: 300000 });

        collector.on('collect', async i => {
            if (i.customId === 'go_home') await i.update({ embeds: [homeEmbed] });
            else if (i.customId === 'go_media') {
                const mediaEmbed = new EmbedBuilder()
                    .setColor(color)
                    .setTitle(`📸 ARQUIVOS DE MÍDIA: ${user.username}`)
                    .setImage(user.displayAvatarURL({ size: 2048, dynamic: true }))
                    .setDescription(userFetch.bannerURL() ? `**Banner Detetado:** [Clique aqui para abrir](${userFetch.bannerURL({ size: 4096 })})` : "Sem banner registrado.");
                await i.update({ embeds: [mediaEmbed] });
            }
            else if (i.customId === 'gen_qr') {
                const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://discord.com/users/${user.id}`;
                const qrEmbed = new EmbedBuilder()
                    .setColor(color)
                    .setTitle("📲 QR CODE DE IDENTIDADE")
                    .setImage(qrUrl);
                await i.reply({ embeds: [qrEmbed], ephemeral: true });
            }
        });

        collector.on('end', () => msg.edit({ components: [] }).catch(() => null));
    }
};