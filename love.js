const { EmbedBuilder } = require('discord.js');
const JsoningLib = require("jsoning");
const Jsoning = typeof JsoningLib === "function" ? JsoningLib : JsoningLib.default;
const db = new Jsoning("database.json");

module.exports = {
    name: "love",
    aliases: ["amor", "carinho", "afeto"],
    description: "Fortalece o vínculo matrimonial e aumenta o Love XP.",
    async run(ctx, args) {
        const author = ctx.author || ctx.user;
        const partnerId = await db.get(`marry_${author.id}`);

        // --- VALIDAÇÃO DE ESTADO CIVIL ---
        if (!partnerId) {
            return ctx.reply("💔 **SOLITUDE:** Você precisa estar casado para usar este protocolo. Use `d!marry`.");
        }

        // --- SISTEMA DE COOLDOWN (8 HORAS - VERSÃO FREE) ---
        const lastLove = await db.get(`last_love_${author.id}`) || 0;
        const cooldown = 8 * 60 * 60 * 1000; 
        if (Date.now() - lastLove < cooldown) {
            const remaining = lastLove + cooldown;
            return ctx.reply(`⏳ **RECARGA:** Suas energias afetivas estão em 0%. Disponível novamente <t:${Math.floor(remaining/1000)}:R>.`);
        }

        // --- DADOS DO VÍNCULO ---
        let loveXP = await db.get(`marry_love_xp_${author.id}`) || 0;
        let stability = await db.get(`marry_stability_${author.id}`) ?? 100;
        const lastToLove = await db.get(`last_user_love_${author.id}`);
        
        // --- LÓGICA DE SORTE (CRÍTICO) ---
        let xpGanho = Math.floor(Math.random() * 20) + 10;
        let isCritical = false;
        if (Math.random() < 0.05) { // 5% de chance de crítico
            xpGanho *= 2;
            isCritical = true;
        }
        
        loveXP += xpGanho;
        if (stability < 100) stability = Math.min(100, stability + 2);

        // --- SALVANDO DADOS ---
        await db.set(`marry_love_xp_${author.id}`, loveXP);
        await db.set(`marry_love_xp_${partnerId}`, loveXP);
        await db.set(`marry_stability_${author.id}`, stability);
        await db.set(`marry_stability_${partnerId}`, stability);
        await db.set(`last_love_${author.id}`, Date.now());
        await db.set(`last_user_love_${author.id}`, author.id);
        await db.set(`last_user_love_${partnerId}`, author.id);

        // --- EMBED VISUAL ---
        const loveEmbed = new EmbedBuilder()
            .setColor(isCritical ? "#FF0000" : "#FF69B4")
            .setAuthor({ name: "SINCRONIA AFETIVA", iconURL: "https://i.imgur.com/8Q9Z5O6.png" })
            .setTitle(isCritical ? "❤️ AMOR VERDADEIRO (CRÍTICO!)" : "💖 VÍNCULO FORTALECIDO")
            .setDescription(
                `**${author.username}** enviou uma carga de afeto para <@${partnerId}>.\n\n` +
                "**RELATÓRIO DE IMPACTO:**\n" +
                "```ansi\n" +
                `${isCritical ? "\u001b[1;31m[!] MULTIPLICADOR DE SORTE ATIVADO\u001b[0m\n" : ""}` +
                `\u001b[1;32m+${xpGanho} Love XP\u001b[0m\n` +
                `\u001b[1;37mTotal Acumulado: ${loveXP}\u001b[0m\n` +
                "```"
            )
            .addFields(
                { 
                    name: "📈 Estabilidade do Sistema", 
                    value: `\`\`\`ansi\n\u001b[1;36m[${"█".repeat(Math.floor(stability/10))}${" ".repeat(10 - Math.floor(stability/10))}] ${stability}%\u001b[0m\n\`\`\``,
                    inline: false
                },
                {
                    name: "👤 Última Interação",
                    value: lastToLove ? (lastToLove === author.id ? "Você está mantendo a chama acesa!" : `<@${lastToLove}> foi o último. Retribuição concluída!`) : "Iniciando histórico...",
                    inline: false
                }
            )
            .setFooter({ text: "Dica: Casais com 10.000 XP ganham destaque no Premium." })
            .setTimestamp();

        await ctx.reply({ content: `💓 <@${partnerId}>, o sistema detectou uma nova demonstração de afeto!`, embeds: [loveEmbed] });
    }
};