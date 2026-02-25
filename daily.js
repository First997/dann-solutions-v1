const { EmbedBuilder } = require('discord.js');
const JsoningLib = require("jsoning");
const Jsoning = typeof JsoningLib === "function" ? JsoningLib : JsoningLib.default;
const db = new Jsoning("database.json");

module.exports = {
    name: "daily",
    aliases: ["diario", "coletar"],
    description: "Sincroniza seus créditos diários com o banco central.",
    async run(ctx, args) {
        const user = ctx.author || ctx.user;
        
        const lastDaily = await db.get(`last_daily_${user.id}`) || 0;
        const streak = await db.get(`streak_${user.id}`) || 0;
        const cooldown = 24 * 60 * 60 * 1000;

        // --- LÓGICA DE STREAK (SEQUÊNCIA) ---
        let currentStreak = streak;
        const timePassed = Date.now() - lastDaily;

        if (timePassed < cooldown) {
            const remaining = lastDaily + cooldown;
            // Retornamos a resposta para o index apagar após 15s
            const msgCooldown = await ctx.reply(`⏳ **RECARGA EM ANDAMENTO:** Os servidores de pagamento estão offline para você. Disponível em: <t:${Math.floor(remaining/1000)}:R>.`);
            return msgCooldown;
        }

        // Se passou mais de 48h, perde a sequência
        if (timePassed > (cooldown * 2)) {
            currentStreak = 0;
        }
        currentStreak++;

        // --- CÁLCULO DE VALORES ---
        let baseAmount = Math.floor(Math.random() * 400) + 600; // 600 a 1000
        const partnerId = await db.get(`marry_${user.id}`);
        
        let bonusMarry = partnerId ? Math.floor(baseAmount * 0.20) : 0;
        let bonusStreak = Math.floor(baseAmount * (currentStreak * 0.05)); // 5% por dia de sequência
        
        const total = baseAmount + bonusMarry + bonusStreak;

        // --- SALVAR NA DB ---
        const currentMoney = await db.get(`money_${user.id}`) || 0;
        await db.set(`money_${user.id}`, currentMoney + total);
        await db.set(`last_daily_${user.id}`, Date.now());
        await db.set(`streak_${user.id}`, currentStreak);

        const dailyEmbed = new EmbedBuilder()
            .setColor("#2B2D31")
            .setAuthor({ name: `CENTRAL DE CRÉDITOS • STREAK: ${currentStreak}x`, iconURL: user.displayAvatarURL() })
            .setTitle("✅ SINCRONIZAÇÃO CONCLUÍDA")
            .setDescription(
                `Os fundos foram injetados na sua conta com sucesso.\n\n` +
                "**DETALHAMENTO DOS RECEBÍVEIS:**\n" +
                "```ansi\n" +
                `• Valor Base:    \u001b[1;32m$${baseAmount}\u001b[0m\n` +
                `• Bônus União:   \u001b[1;34m$${bonusMarry}\u001b[0m\n` +
                `• Bônus Streak:  \u001b[1;33m$${bonusStreak}\u001b[0m\n` +
                `--------------------------\n` +
                `• TOTAL:         \u001b[1;37m$${total}\u001b[0m\n` +
                "```"
            )
            .setFooter({ text: "Dica: Não perca sua sequência para aumentar os bônus!" });

        // Retornamos o reply para ativar o auto-delete do seu index.js
        return await ctx.reply({ embeds: [dailyEmbed] });
    }
};