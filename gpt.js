const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ActivityType } = require('discord.js');

module.exports = {
    name: "gpt",
    aliases: ["ia", "ask", "chat"],
    description: "Consulta a inteligência artificial para obter respostas complexas.",
    async run(ctx, args) {
        const user = ctx.author || ctx.user;
        const prompt = args.join(" ");

        // --- SISTEMA DE VALIDAÇÃO DE ENTRADA ---
        if (!prompt) {
            const noPromptEmbed = new EmbedBuilder()
                .setColor("#E74C3C")
                .setAuthor({ name: "SISTEMA DE INTELIGÊNCIA VIRTUAL", iconURL: ctx.client.user.displayAvatarURL() })
                .setTitle("⚠️ NENHUMA CONSULTA DETECTADA")
                .setDescription(
                    "Para utilizar o módulo GPT, você precisa fornecer uma pergunta ou instrução.\n\n" +
                    "**Exemplo:**\n" +
                    `> \`${process.env.PREFIX}gpt como criar um servidor de elite no Discord?\``
                )
                .setFooter({ text: "Aguardando entrada de dados..." });

            return ctx.reply({ embeds: [noPromptEmbed] });
        }

        // --- INTERFACE DE PROCESSAMENTO (LOADING) ---
        const waitEmbed = new EmbedBuilder()
            .setColor("#3498DB")
            .setAuthor({ name: "PROCESSANDO REQUISIÇÃO", iconURL: "https://i.imgur.com/8Q9Z5O6.png" })
            .setDescription(
                "🛰️ **Conectando aos servidores neurais...**\n" +
                "🧠 **Analisando semântica da pergunta...**\n" +
                "⚡ **Gerando resposta otimizada...**"
            )
            .setFooter({ text: "Isso pode levar alguns segundos dependendo da complexidade." });

        const loadingMsg = await ctx.reply({ embeds: [waitEmbed], fetchReply: true });

        // Simulação de delay para "humanizar" a IA (Opcional, mas dá um toque premium)
        try {
            // NOTA: Aqui você integraria com sua API key (OpenAI/Gemini/etc)
            // Por enquanto, faremos uma estrutura robusta de resposta
            
            // Simulando busca...
            await new Promise(resolve => setTimeout(resolve, 3000));

            const responseEmbed = new EmbedBuilder()
                .setColor("#2B2D31")
                .setAuthor({ name: "RESPOSTA DA INTELIGÊNCIA ARTIFICIAL", iconURL: ctx.client.user.displayAvatarURL() })
                .setTitle(`🔍 Consulta: ${prompt.substring(0, 50)}${prompt.length > 50 ? "..." : ""}`)
                .setDescription(
                    `Olá ${user}, aqui está o resultado da minha análise:\n\n` +
                    "```txt\nO sistema está configurado para o modo de desenvolvimento. Para obter respostas reais, integre sua API Key da OpenAI no arquivo .env.\n```\n" +
                    "**Informações Técnicas:**\n" +
                    "> Modelo: `GPT-4 Turbo` (Simulado)\n" +
                    "> Tempo de Resposta: `2.84s`\n" +
                    "> Tokens Utilizados: `142`"
                )
                .addFields({ 
                    name: "💡 Dica de Especialista", 
                    value: "Seja específico em suas perguntas para obter resultados mais precisos e técnicos.", 
                    inline: false 
                })
                .setFooter({ text: "Dann Solutions AI Division • Resposta gerada via rede neural" })
                .setTimestamp();

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('delete_ai')
                    .setLabel('Apagar Resposta')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🗑️')
            );

            await loadingMsg.edit({ embeds: [responseEmbed], components: [row] });

            // Coletor para o botão de apagar
            const collector = loadingMsg.createMessageComponentCollector({
                filter: i => i.user.id === user.id,
                time: 60000
            });

            collector.on('collect', async i => {
                if (i.customId === 'delete_ai') {
                    await loadingMsg.delete().catch(() => null);
                }
            });

        } catch (error) {
            console.error(error);
            const errorEmbed = new EmbedBuilder()
                .setColor("#FF0000")
                .setTitle("🚨 FALHA NA CONEXÃO NEURAL")
                .setDescription("Ocorreu um erro ao tentar se comunicar com o servidor da IA. Tente novamente em alguns instantes.");
            
            await loadingMsg.edit({ embeds: [errorEmbed] });
        }
    }
};