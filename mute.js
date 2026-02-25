const { 
    EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, 
    StringSelectMenuBuilder 
} = require('discord.js');
const JsoningLib = require("jsoning");
const Jsoning = typeof JsoningLib === "function" ? JsoningLib : JsoningLib.default;
const db = new Jsoning("database.json");

module.exports = {
    name: "mute",
    aliases: ["silenciar", "timeout", "isolamento", "castigo"],
    description: "Corta a frequência de transmissão de um indivíduo (Isolamento).",
    async run(ctx, args) {
        if (!ctx.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return ctx.reply("⚠️ **ACESSO NEGADO:** Requer autorização Nível 2 (MODERATE_MEMBERS).");
        }

        const target = ctx.mentions.members.first() || ctx.guild.members.cache.get(args[0]);
        if (!target) return ctx.reply("⚠️ **ALVO NÃO DETECTADO:** Mencione o infrator ou forneça o ID.");

        if (target.id === ctx.author.id) return ctx.reply("❌ **ERRO:** Você não pode aplicar isolamento a si mesmo.");
        if (!target.moderatable) return ctx.reply("🛡️ **DEFESA ATIVA:** Não posso silenciar este indivíduo (Hierarquia superior).");

        const mutesCount = await db.get(`mutes_${target.id}`) || 0;

        const mainEmbed = new EmbedBuilder()
            .setColor("#5865F2")
            .setAuthor({ name: "PROTOCOLO DE ISOLAMENTO", iconURL: target.user.displayAvatarURL() })
            .setDescription(
                `### 📂 ANÁLISE DE FREQUÊNCIA\n` +
                `**Infrator:** ${target.user.tag}\n` +
                `**Histórico:** \`${mutesCount}\` isolamentos registrados.\n\n` +
                `Selecione abaixo a **Duração do Silenciamento** para o alvo.`
            )
            .setFooter({ text: "O alvo será impedido de interagir em texto e voz." });

        const menu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('select_mute_time')
                .setPlaceholder('⏱️ Definir Período de Silêncio...')
                .addOptions([
                    { label: '60 Segundos', value: '60000', emoji: '⏲️', description: 'Advertência rápida.' },
                    { label: '10 Minutos', value: '600000', emoji: '⏳', description: 'Isolamento padrão por má conduta.' },
                    { label: '1 Hora', value: '3600000', emoji: '🕒', description: 'Silenciamento prolongado.' },
                    { label: '1 Dia', value: '86400000', emoji: '📅', description: 'Remoção de acesso por 24 horas.' },
                    { label: '1 Semana', value: '604800000', emoji: '🚫', description: 'Isolamento máximo permitido.' }
                ])
        );

        const msg = await ctx.reply({ embeds: [mainEmbed], components: [menu] });

        const collector = msg.createMessageComponentCollector({ filter: i => i.user.id === ctx.author.id, time: 30000 });

        collector.on('collect', async i => {
            const duration = parseInt(i.values[0]);
            await i.deferUpdate();

            try {
                // Aplica o Timeout nativo do Discord
                await target.timeout(duration, `Isolamento por ${ctx.author.tag}`);
                await db.set(`mutes_${target.id}`, mutesCount + 1);

                // Aviso na DM
                const dmEmbed = new EmbedBuilder()
                    .setColor("#5865F2")
                    .setTitle(`🔇 COMUNICAÇÃO CORTADA - ${ctx.guild.name.toUpperCase()}`)
                    .setDescription(`Suas permissões de interação foram suspensas.\n\n**Duração:** \`${i.component.options.find(o => o.value === i.values[0]).label}\`\n**Operador:** \`${ctx.author.tag}\``)
                    .setFooter({ text: "Aguarde o término do período para restabelecer o sinal." });

                await target.send({ embeds: [dmEmbed] }).catch(() => null);

                const successEmbed = new EmbedBuilder()
                    .setColor("#2B2D31")
                    .setAuthor({ name: "SINAL INTERROMPIDO", iconURL: "https://i.imgur.com/8Q9Z5O6.png" })
                    .setDescription(
                        "```ansi\n" +
                        `• STATUS:      \u001b[1;34mISOLADO\u001b[0m\n` +
                        `• DURAÇÃO:     \u001b[1;37m${i.component.options.find(o => o.value === i.values[0]).label}\u001b[0m\n` +
                        `• REINCIDÊNCIA: \u001b[1;33m${mutesCount + 1}\u001b[0m\n` +
                        "```"
                    );

                await msg.edit({ embeds: [successEmbed], components: [] });

            } catch (err) {
                console.error(err);
                await msg.edit({ content: "❌ **FALHA NO SISTEMA:** Não foi possível aplicar o isolamento.", embeds: [], components: [] });
            }
        });
    }
};