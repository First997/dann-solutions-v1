const { EmbedBuilder } = require('discord.js');
const JsoningLib = require("jsoning");
const Jsoning = typeof JsoningLib === "function" ? JsoningLib : JsoningLib.default;
const db = new Jsoning("database.json");

module.exports = {
    name: "pay",
    aliases: ["pagar", "transferir", "pix"],
    description: "Transfere seus ativos para outro usuário da rede.",
    async run(ctx, args) {
        const sender = ctx.author || ctx.user;
        const target = ctx.mentions?.users?.first() || ctx.client.users.cache.get(args?.[0]);
        const amount = parseInt(args?.[1]);

        // --- VALIDAÇÕES DE SEGURANÇA ---
        if (!target) {
            const msg = await ctx.reply("⚠️ **ERRO:** Você precisa mencionar um usuário ou fornecer um ID válido.");
            return msg;
        }

        if (target.id === sender.id) {
            const msg = await ctx.reply("⚠️ **OPERAÇÃO INVÁLIDA:** Você não pode transferir créditos para si mesmo.");
            return msg;
        }

        if (target.bot) {
            const msg = await ctx.reply("⚠️ **OPERAÇÃO INVÁLIDA:** Sistemas robóticos não possuem contas bancárias.");
            return msg;
        }

        if (isNaN(amount) || amount <= 0) {
            const msg = await ctx.reply("⚠️ **ERRO:** Quantidade inválida. Digite um valor numérico positivo.");
            return msg;
        }

        // --- VERIFICAÇÃO DE SALDO ---
        const senderMoney = await db.get(`money_${sender.id}`) || 0;

        if (senderMoney < amount) {
            const msg = await ctx.reply(`❌ **FALHA NA TRANSAÇÃO:** Saldo insuficiente. Você possui apenas \`$${senderMoney.toLocaleString()}\`.`);
            return msg;
        }

        // --- PROCESSAMENTO DA TRANSAÇÃO ---
        const targetMoney = await db.get(`money_${target.id}`) || 0;

        await db.set(`money_${sender.id}`, senderMoney - amount);
        await db.set(`money_${target.id}`, targetMoney + amount);

        const payEmbed = new EmbedBuilder()
            .setColor("#00FF00")
            .setAuthor({ name: "COMPROVANTE DE TRANSFERÊNCIA", iconURL: sender.displayAvatarURL() })
            .setDescription(
                `A transação bancária foi processada com sucesso.\n\n` +
                "**DETALHES DO LANÇAMENTO:**\n" +
                "```ansi\n" +
                `• ORIGEM:  \u001b[1;37m${sender.username}\u001b[0m\n` +
                `• DESTINO: \u001b[1;34m${target.username}\u001b[0m\n` +
                `• VALOR:   \u001b[1;32m$${amount.toLocaleString()}\u001b[0m\n` +
                `--------------------------\n` +
                `• STATUS:  \u001b[1;32mEFETIVADO\u001b[0m\n` +
                "```"
            )
            .setTimestamp()
            .setFooter({ text: "Dann Solutions • Autenticação Bancária" });

        // Retorna para o Auto-Delete do index limpar em 15s
        return await ctx.reply({ content: `${target}`, embeds: [payEmbed] });
    }
};