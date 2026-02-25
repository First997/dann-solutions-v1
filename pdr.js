const { EmbedBuilder } = require('discord.js');
const JsoningLib = require("jsoning");
const Jsoning = typeof JsoningLib === "function" ? JsoningLib : JsoningLib.default;
const db = new Jsoning("database.json");

module.exports = {
    name: "pdr",
    description: "Remove a Primeira Dama de um usuário.",
    async run(ctx) {
        const author = ctx.author || ctx.user;
        const pdExistente = await db.get(`pd_${author.id}`);

        if (!pdExistente) return ctx.reply("❌ Você não possui uma Primeira Dama setada para remover.");

        await db.delete(`pd_${author.id}`);
        
        ctx.reply(`✅ A Primeira Dama foi removida com sucesso de <@${author.id}>.`);
    }
};