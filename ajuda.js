const { 
    EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, 
    ButtonStyle, ButtonBuilder, ComponentType 
} = require('discord.js');

module.exports = {
    name: "ajuda",
    aliases: ["help", "comandos"],
    description: "Exibe o centro de comando e suporte do bot.",
    slashData: {
        name: "ajuda",
        description: "Acesse a central de comando do bot."
    },

    async run(ctx) {
        const user = ctx.author || ctx.user;
        const client = ctx.client;

        // --- CONTEXTO DE CARREGAMENTO ---
        const loadingEmbed = new EmbedBuilder()
            .setColor("#2B2D31")
            .setDescription("🛰️ **Sincronizando banco de dados e categorias...**");
        
        const initialMsg = await ctx.reply({ embeds: [loadingEmbed], fetchReply: true });

        // --- EMBED PRINCIPAL ---
        const mainEmbed = new EmbedBuilder()
            .setColor("#2B2D31")
            .setAuthor({ 
                name: `CENTRAL DE COMANDOS • ${client.user.username.toUpperCase()}`, 
                iconURL: client.user.displayAvatarURL() 
            })
            .setTitle("🖥️ Terminal de Operações Governamentais")
            .setDescription(
                `Olá **${user.username}**, bem-vindo ao suporte de inteligência.\n\n` +
                "Este terminal contém todos os protocolos de moderação, proteção e diversão do servidor. " +
                "Utilize o menu de seleção abaixo para navegar entre as camadas de comando.\n\n" +
                "**🔍 Informações Adicionais:**\n" +
                `> Prefixo Atual: \`d!\` ou \`/\` (Slash)\n` +
                `> Latência: \`${client.ws.ping}ms\`\n` +
                `> Servidor: \`${ctx.guild.name}\`\n\n` +
                "**⚠️ Aviso:** Comandos de administração exigem permissões específicas de alto escalão."
            )
            .addFields({ 
                name: "📌 Atalhos Rápidos", 
                value: "🏠 **Início** | 🛡️ **Segurança** | 📩 **Suporte**", 
                inline: false 
            })
            .setFooter({ text: "Sistema rodando em Ambiente de Alta Performance • Dann Solutions" })
            .setTimestamp();

        const menu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('help_menu_v2')
                .setPlaceholder('🛡️ Navegar pelas Categorias...')
                .addOptions([
                    { label: 'Comandos Gerais', value: 'cat_geral', emoji: '🌍', description: 'Utilidades, Avatares, Banners e Economia.' },
                    { label: 'Protocolos de Moderação', value: 'cat_mod', emoji: '🛡️', description: 'Ban, Kick, Mute e Clear.' },
                    { label: 'Módulo de Proteção', value: 'cat_prot', emoji: '⚔️', description: 'Sistemas Anti-Link e Auditoria.' },
                    { label: 'Central de Suporte', value: 'cat_ticket', emoji: '📩', description: 'Sistema de Tickets e Atendimento.' },
                    { label: 'Sistema Primeira Dama', value: 'cat_pd', emoji: '👑', description: 'Gestão de parceiras e status real.' },
                    { label: 'Gerenciamento VIP', value: 'cat_vip', emoji: '💎', description: 'Setar VIP e ver benefícios exclusivos.' }
                ])
        );

        // --- ADIÇÃO: BOTÃO ATUALIZADO COM SEU SITE ---
        const buttons = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('Suporte')
                .setURL('https://discord.gg/convite') // Altere se tiver outro convite
                .setStyle(ButtonStyle.Link),
            new ButtonBuilder()
                .setLabel('Painel Web')
                .setURL('https://dann-solutions.vercel.app/') // SEU SITE ADICIONADO AQUI
                .setStyle(ButtonStyle.Link) // MUDADO PARA LINK PARA FUNCIONAR
        );

        await (initialMsg.edit ? initialMsg.edit({ embeds: [mainEmbed], components: [menu, buttons] }) : ctx.editReply({ embeds: [mainEmbed], components: [menu, buttons] }));

        // --- COLETOR COM AUTO-DELETE (MANTIDO) ---
        const collector = (initialMsg.createMessageComponentCollector ? initialMsg : await ctx.fetchReply()).createMessageComponentCollector({
            filter: i => i.user.id === user.id,
            time: 120000 
        });

        collector.on('collect', async i => {
            if (i.customId === 'back_to_main') {
                return await i.update({ embeds: [mainEmbed], components: [menu, buttons] }).catch(() => null);
            }

            if (i.customId === 'help_menu_v2') {
                const category = i.values[0];
                const catEmbed = new EmbedBuilder().setColor("#2B2D31").setTimestamp();

                const backButton = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('back_to_main').setLabel('Voltar ao Início').setStyle(ButtonStyle.Secondary).setEmoji('⬅️')
                );

                switch(category) {
                    case 'cat_geral':
                        catEmbed.setTitle("🌍 Protocolos Gerais e Sociais")
                            .setDescription(
                                "Comandos disponíveis para todos os usuários civis do servidor.\n\n" +
                                "📝 **IDENTIFICAÇÃO:**\n" +
                                "> `d!perfil` - Exibe o dossiê completo (XP, Casamento e Money).\n" +
                                "> `d!av` - Puxa o avatar em alta definição.\n" +
                                "> `d!banner` - Exibe o banner de perfil.\n\n" +
                                "🫂 **SOCIAL:**\n" +
                                "> `d!marry` - Inicia um pedido de casamento formal.\n" +
                                "> `d!love` - Fortalece o vínculo e aumenta o Love XP.\n" +
                                "> `d!ship` - Calcula a afinidade entre dois usuários.\n" +
                                "> `d!divorce` - Encerra um compromisso matrimonial.\n\n" +
                                "💰 **ECONOMIA:**\n" +
                                "> `d!daily` - Resgata seus créditos diários.\n" +
                                "> `d!atm` - Consulta seu saldo bancário.\n" +
                                "> `d!pay` - Transfere créditos para outro usuário."
                            );
                        break;
                    case 'cat_mod':
                        catEmbed.setTitle("🛡️ Protocolos de Moderação")
                            .setDescription(
                                "Comandos restritos à equipe de segurança do servidor.\n\n" +
                                "🔨 **SENTENÇAS:**\n" +
                                "> `d!ban` - Exila um membro com limpeza de mensagens.\n" +
                                "> `d!kick` - Remove um indivíduo do setor.\n" +
                                "> `d!mute` - Aplica isolamento temporal (Timeout).\n" +
                                "> `d!unmute` - Restabelece a frequência do usuário.\n\n" +
                                "🧹 **SANEAMENTO:**\n" +
                                "> `d!clear` - Vaporiza até 100 mensagens.\n\n" +
                                "🔑 **CONTROLE:**\n" +
                                "> `d!lock` / `d!unlock` - Altera o acesso do canal."
                            );
                        break;
                    case 'cat_ticket':
                        catEmbed.setTitle("📩 Central de Suporte e Atendimento")
                            .setDescription(
                                "Módulos de comunicação direta com a administração.\n\n" +
                                "🎫 **CONFIGURAÇÃO:**\n" +
                                "> `d!setup-ticket` - Instala o painel de atendimento.\n\n" +
                                "📋 **FUNÇÕES DO TICKET:**\n" +
                                "> `Botão Assumir` - Vincula um staff.\n" +
                                "> `Botão Log` - Gera a transcrição.\n" +
                                "> `Botão Fechar` - Encerra o protocolo."
                            );
                        break;
                    case 'cat_pd':
                        catEmbed.setTitle("👑 Sistema de Primeira Dama")
                            .setDescription(
                                "Gerenciamento de status social de alto escalão.\n\n" +
                                "> `d!pda @user` - Nomeia uma usuária como Primeira Dama.\n" +
                                "> `d!pdr` - Destitui o cargo atual.\n" +
                                "> `d!pd` - Exibe quem ocupa o cargo ao seu lado."
                            );
                        break;
                    case 'cat_vip':
                        catEmbed.setTitle("💎 Módulo de Membros VIP")
                            .setDescription(
                                "Vantagens e privilégios para doadores.\n\n" +
                                "> `d!setvip` - Concede o status VIP.\n" +
                                "> `d!vip` - Verifica o tempo restante.\n" +
                                "> `d!addvip` - Adiciona dias ao plano."
                            );
                        break;
                    case 'cat_prot':
                        catEmbed.setTitle("⚔️ Módulo de Proteção Governamental")
                            .setDescription(
                                "Sistemas de defesa ativa contra ameaças.\n\n" +
                                "🛡️ **ANTI-LINK:** Bloqueia automaticamente links e convites.\n" +
                                "🛡️ **AUDITORIA:** Todos os comandos geram logs ANSI.\n" +
                                "🛡️ **INTELIGÊNCIA:** Verificação de idade da conta."
                            );
                        break;
                }

                await i.update({ embeds: [catEmbed], components: [menu, backButton] }).catch(() => null);
            }
        });

        // --- FINALIZAÇÃO E LIMPEZA (MANTIDO) ---
        collector.on('end', async () => {
            if (initialMsg) {
                await initialMsg.delete().catch(() => null);
            } else if (ctx.deleteReply) {
                await ctx.deleteReply().catch(() => null);
            }
        });
    }
};