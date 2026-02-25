const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const JsoningLib = require("jsoning");
const Jsoning = typeof JsoningLib === "function" ? JsoningLib : JsoningLib.default;
const db = new Jsoning("database.json");

module.exports = {
    name: "pda",
    aliases: ["setpd", "coroar"],
    description: "Nomeia oficialmente sua Primeira Dama no servidor.",
    async run(ctx, args) {
        const author = ctx.author || ctx.user;
        const target = ctx.mentions.users.first();
        const client = ctx.client;

        // --- SISTEMA DE VALIDAÇÃO DE ELITE ---
        if (!target) {
            return ctx.reply({ 
                content: "👑 **PROTOCOLO REAL:** Você precisa mencionar a usuária que deseja coroar como sua Primeira Dama.",
                ephemeral: true 
            });
        }

        if (target.id === author.id) {
            return ctx.reply({ content: "❌ **ERRO:** Você não pode ser sua própria Primeira Dama. O cargo exige um par.", ephemeral: true });
        }

        if (target.bot) {
            return ctx.reply({ content: "🤖 **SISTEMA:** Unidades cibernéticas não podem ocupar cargos na Corte Real.", ephemeral: true });
        }

        // --- VERIFICAÇÃO DE BANCO DE DADOS ---
        const currentPD = await db.get(`pd_${author.id}`);
        if (currentPD) {
            const alreadyPD = client.users.cache.get(currentPD) || { username: "Usuária Desconhecida" };
            return ctx.reply({ 
                content: `⚠️ **CONFLITO DE CORTE:** Você já possui uma Primeira Dama registrada (<@${currentPD}>). Use \`d!pdr\` para destituí-la antes de uma nova coroação.`,
                ephemeral: true 
            });
        }

        // --- INTERFACE DE CONFIRMAÇÃO ---
        const crownEmbed = new EmbedBuilder()
            .setColor("#FF1493")
            .setAuthor({ name: "CHANCELARIA DA CORTE REAL", iconURL: client.user.displayAvatarURL() })
            .setTitle("👑 Proclamação de Cargo Real")
            .setThumbnail(target.displayAvatarURL({ dynamic: true, size: 1024 }))
            .setDescription(
                `Atenção a todos os súditos do servidor **${ctx.guild.name}**!\n\n` +
                `O nobre ${author} deseja conceder o título de **Primeira Dama** à cidadã ${target}.\n\n` +
                "**Privilégios do Cargo:**\n" +
                "• Reconhecimento oficial no comando `d!pds`.\n" +
                "• Exibição de status de elite no perfil governamental.\n" +
                "• Lealdade e proteção da guarda real.\n\n" +
                "**Deseja oficializar este decreto agora?**"
            )
            .addFields({ name: "📋 Termos", value: "A coroação é um ato público e ficará registrada nos anais do servidor.", inline: false })
            .setFooter({ text: "Aguardando confirmação do proponente..." })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('confirm_pd').setLabel('Confirmar Coroação').setStyle(ButtonStyle.Success).setEmoji('👑'),
            new ButtonBuilder().setCustomId('cancel_pd').setLabel('Cancelar Decreto').setStyle(ButtonStyle.Danger).setEmoji('✖️')
        );

        const msg = await ctx.reply({ embeds: [crownEmbed], components: [row], fetchReply: true });

        // --- COLETOR DE DECISÃO ---
        const collector = msg.createMessageComponentCollector({
            filter: i => i.user.id === author.id,
            time: 30000,
            max: 1
        });

        collector.on('collect', async i => {
            if (i.customId === 'confirm_pd') {
                await db.set(`pd_${author.id}`, target.id);
                
                const successEmbed = new EmbedBuilder()
                    .setColor("#FFD700")
                    .setTitle("🏟️ GRANDE CELEBRAÇÃO REAL")
                    .setDescription(`✅ **DECRETO PUBLICADO!**\n\nDe hoje em diante, **${target.username}** é reconhecida como a legítima **Primeira Dama** de **${author.username}**.\n\nQue sua regência seja próspera!`)
                    .setImage("https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNGM5YjIyYTlhM2M5YmIyYTlhM2M5YmIyYTlhM2M5YmIyYTlhM2M5JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/okLCopvHZH0Fq/giphy.gif");

                await i.update({ embeds: [successEmbed], components: [] });
            } else {
                await i.update({ content: "❌ O decreto foi rasgado e a coroação cancelada.", embeds: [], components: [] });
            }
        });
    }
};