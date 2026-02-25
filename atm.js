const { EmbedBuilder } = require('discord.js');
const JsoningLib = require("jsoning");
const Jsoning = typeof JsoningLib === "function" ? JsoningLib : JsoningLib.default;
const db = new Jsoning("database.json");

module.exports = {
    name: "atm",
    aliases: ["bal", "money", "saldo", "carteira"],
    description: "Realiza um escaneamento nos seus ativos financeiros.",
    async run(ctx, args) {
        // AJUSTE: O '?' evita o erro "TypeError: Cannot read properties of undefined" no Slash
        const user = ctx.mentions?.users?.first() || ctx.client.users.cache.get(args?.[0]) || (ctx.author || ctx.user);
        
        const money = await db.get(`money_${user.id}`) || 0;
        const streak = await db.get(`streak_${user.id}`) || 0;

        // --- CLASSIFICAÇÃO SOCIAL ---
        let rank = "Cidadão Comum";
        let color = "#2B2D31";
        if (money > 100000) { rank = "Elite Governamental"; color = "#FFD700"; }
        else if (money > 50000) { rank = "Investidor da Rede"; color = "#00EAD3"; }
        else if (money > 10000) { rank = "Trabalhador Estável"; color = "#1abc9c"; }

        const atmEmbed = new EmbedBuilder()
            .setColor(color)
            .setAuthor({ name: `EXTRATO DE ATIVOS • ${user.username}`, iconURL: user.displayAvatarURL() })
            .setDescription(
                `**Classe Social:** \`${rank}\`\n\n` +
                "**RESERVAS DISPONÍVEIS:**\n" +
                "```ansi\n" +
                `🏦 Saldo Bancário: \u001b[1;32m$ ${money.toLocaleString()}\u001b[0m\n` +
                `🔥 Sequência Daily: \u001b[1;33m${streak} dias\u001b[0m\n` +
                "```"
            )
            .addFields({ 
                name: "💳 Cartão de Crédito", 
                value: `****${user.id.slice(-4)}** - Ativo`, 
                inline: true 
            })
            .setFooter({ text: "Sistema de Monitoramento Financeiro" });

        // AJUSTE: Adicionamos o 'return' para que o index saiba que deve apagar esta mensagem depois
        return await ctx.reply({ embeds: [atmEmbed] });
    }
};