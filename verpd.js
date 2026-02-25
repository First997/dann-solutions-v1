const { EmbedBuilder } = require('discord.js');
const JsoningLib = require("jsoning");
const Jsoning = typeof JsoningLib === "function" ? JsoningLib : JsoningLib.default;
const db = new Jsoning("database.json");

module.exports = {
    name: "pd",
    description: "Verifica quem é a sua Primeira Dama.",
    async run(ctx) {
        const user = ctx.author || ctx.user;
        const pdId = await db.get(`pd_${user.id}`);

        if (!pdId) return ctx.reply("💔 Você ainda não possui uma Primeira Dama setada.");

        ctx.reply(`👑 Sua Primeira Dama atual é: <@${pdId}>`);
    }
};