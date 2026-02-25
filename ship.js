const { EmbedBuilder } = require('discord.js');
const JsoningLib = require("jsoning");
const Jsoning = typeof JsoningLib === "function" ? JsoningLib : JsoningLib.default;
const db = new Jsoning("database.json");

module.exports = {
    name: "ship",
    aliases: ["compatibilidade", "shipar", "fusion"],
    description: "Calcula a fusão biométrica e afinidade entre dois usuários.",
    async run(ctx, args) {
        const user1 = ctx.author;
        const user2 = ctx.mentions.users.first();

        if (!user2) return ctx.reply("⚠️ **AVISO:** Identifique o segundo indivíduo para iniciar a bio-análise.");
        if (user1.id === user2.id) return ctx.reply("🧪 **ERRO:** Sistema em loop. Não é possível shipar o próprio núcleo.");

        // --- GERADOR DE SHIPNAME (A MÁGICA) ---
        const name1 = user1.username;
        const name2 = user2.username;
        const shipName = name1.substring(0, Math.ceil(name1.length / 2)) + name2.substring(Math.floor(name2.length / 2));

        // --- LÓGICA DE PERCENTUAL ---
        const isMarried = await db.get(`marry_${user1.id}`) === user2.id;
        // Se casados, chance alta. Se não, totalmente aleatório.
        let percent = isMarried ? Math.floor(Math.random() * 11) + 90 : Math.floor(Math.random() * 101);

        // --- VEREDITO DO SISTEMA ---
        let veredito = "";
        let color = "#2B2D31";
        let emoji = "📡";

        if (percent < 25) {
            veredito = "⚠️ **ZONA DE PERIGO:** Átomos repelentes. Evite contato prolongado.";
            color = "#FF3E3E";
            emoji = "🚫";
        } else if (percent < 50) {
            veredito = "📉 **SINCRONIA FRACA:** Apenas conhecidos de rede. Sem química detectada.";
            color = "#FFA500";
            emoji = "😐";
        } else if (percent < 85) {
            veredito = "🔥 **POTENCIAL DETECTADO:** Grande chance de colisão romântica. Prossiga.";
            color = "#FF69B4";
            emoji = "💖";
        } else {
            veredito = "💎 **CONEXÃO LENDÁRIA:** Fusão perfeita de núcleos. O casamento é o próximo passo.";
            color = "#00EAD3";
            emoji = "👑";
        }

        // --- CONSTRUÇÃO DA BARRA DE CARGA (ANSI) ---
        const progress = Math.round(percent / 10);
        const bar = `\u001b[1;${percent > 50 ? '32' : '31'}m${"█".repeat(progress)}${" ".repeat(10 - progress)}\u001b[0m`;

        const shipEmbed = new EmbedBuilder()
            .setColor(color)
            .setAuthor({ name: `PROJETO AFFINITY • v1.0`, iconURL: "https://i.imgur.com/8Q9Z5O6.png" })
            .setTitle(`${emoji} Resultado da Bio-Fusão`)
            .setDescription(
                `Analisando compatibilidade entre **${user1.username}** e **${user2.username}**...\n\n` +
                `🎯 **Shipname:** \`${shipName.toUpperCase()}\`\n\n` +
                "**RELATÓRIO DE SINCRONIA:**\n" +
                "```ansi\n" +
                `PROBABILIDADE: ${percent}%\n` +
                `CARGA: [${bar}]\n` +
                "```\n" +
                `${veredito}`
            )
            .setFooter({ text: "Algoritmo Dann-Forense • 2026", iconURL: ctx.client.user.displayAvatarURL() })
            .setTimestamp();

        await ctx.reply({ content: `🔍 **Escaneando...**`, embeds: [shipEmbed] });
    }
};