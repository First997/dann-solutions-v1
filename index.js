/**
 * 🚀 DANN SOLUTIONS - CORE SYSTEM v4.0
 * Desenvolvido para Alta Performance e Segurança
 */

require('dotenv').config();
const { 
    Client, GatewayIntentBits, Collection, REST, 
    Routes, EmbedBuilder, ActivityType, ChannelType,
    PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle,
    AttachmentBuilder
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const colors = require('colors'); // Se não tiver, use: npm install colors

// --- IMPORTAÇÃO DO BANCO DE DADOS (PARA TICKETS) ---
const JsoningLib = require("jsoning");
const Jsoning = typeof JsoningLib === "function" ? JsoningLib : JsoningLib.default;
const db = new Jsoning("database.json");

// --- INICIALIZAÇÃO DO CLIENT DE ELITE ---
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildPresences
    ]
});

// --- COLEÇÕES E VARIÁVEIS DE SISTEMA ---
client.commands = new Collection();
const commandsData = [];
const PREFIX = process.env.PREFIX || "d!";

// --- CARREGAMENTO DINÂMICO DE COMANDOS (ROBUSTO) ---
console.log('📂 Iniciando mapeamento de módulos...'.yellow);

const foldersPath = path.join(__dirname, 'src/commands');
if (!fs.existsSync(foldersPath)) {
    console.log('🚨 ERRO CRÍTICO: Pasta src/commands não encontrada!'.red);
    process.exit(1);
}

const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    if (!fs.statSync(commandsPath).isDirectory()) continue;

    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        try {
            const command = require(filePath);
            
            if ('name' in command && 'run' in command) {
                client.commands.set(command.name, command);
                console.log(`✅ Módulo [${folder}/${file}] carregado com sucesso.`.green);
                
                if (command.slashData) {
                    commandsData.push(command.slashData);
                }
            } else {
                console.log(`⚠️ Módulo [${file}] ignorado: Faltando propriedades 'name' ou 'run'.`.red);
            }
        } catch (error) {
            console.error(`❌ Falha ao carregar [${file}]:`.red, error);
        }
    }
}

// --- HANDLER DE EVENTOS DE PROTEÇÃO (ANTI-LINK) ---
const antiLinkSystem = require('./src/events/messageCreate.js');

// --- EVENTO DE INICIALIZAÇÃO (READY) ---
client.once('ready', async () => {
    console.log('\n' + '='.repeat(40).cyan);
    console.log(`📡 SISTEMA ONLINE: ${client.user.tag}`.bold.green);
    console.log(`👥 Servidores: ${client.guilds.cache.size}`.white);
    console.log(`🛠️ Prefixo: ${PREFIX}`.white);
    console.log('='.repeat(40).cyan + '\n');

    // --- ADIÇÃO: SISTEMA DE STATUS ROTATIVO (DANN SOLUTIONS) ---
    const activities = [
        { name: `🛡️ Segurança ativa em ${client.guilds.cache.size} setores`, type: ActivityType.Watching },
        { name: `🚀 Acesse nosso Painel: dann-solutions.vercel.app`, type: ActivityType.Playing },
        { name: `⚡ Central de Inteligência: ${PREFIX}ajuda`, type: ActivityType.Listening },
        { name: `🛰️ Sincronizando protocolos v4.0...`, type: ActivityType.Competing }
    ];

    let current = 0;
    setInterval(() => {
        client.user.setPresence({
            activities: [activities[current++ % activities.length]],
            status: 'dnd',
        });
    }, 30000); // Muda a cada 30 segundos

    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
    try {
        console.log('⏳ Sincronizando comandos Slash com a API do Discord...'.blue);
        await rest.put(Routes.applicationCommands(client.user.id), { body: commandsData });
        console.log('🚀 Sincronização concluída! Comandos Slash prontos para uso.'.green);
    } catch (error) {
        console.error('🚨 Erro ao registrar Slash Commands:'.red, error);
    }
});

// --- EXECUÇÃO DE INTERAÇÕES (SLASH + TICKETS) ---
client.on('interactionCreate', async interaction => {
    
    // 🛡️ SUB-SISTEMA 1: Comandos Slash
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            console.log(`[SLASH] ${interaction.user.tag} usou /${interaction.commandName}`.blue);
            await command.run(interaction);

            // --- ADIÇÃO: AUTO-DELETE PARA COMANDO AJUDA (SLASH) ---
            if (interaction.commandName === 'ajuda') {
                setTimeout(async () => {
                    await interaction.deleteReply().catch(() => null);
                }, 120000); // 2 minutos
            }

        } catch (error) {
            console.error(`🚨 Erro em /${interaction.commandName}:`.red, error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: '❌ **ERRO INTERNO:** Ocorreu um problema ao processar este comando.', ephemeral: true });
            }
        }
    }

    // --- [NOVO] LÓGICA DE PRÉ-ATENDIMENTO (MENSAGEM EXPLICATIVA) ---
    if (interaction.isButton() && interaction.customId.startsWith('pre_ticket_')) {
        const setor = interaction.customId.split('_')[2];
        
        const infoSetor = {
            denuncia: { cor: "#FF0000", txt: "Para denúncias, tenha IDs e provas em mãos." },
            financeiro: { cor: "#00FF00", txt: "Assuntos de VIP e Loja exigem comprovante." },
            suporte: { cor: "#0099FF", txt: "Dúvidas gerais. Descreva seu problema abaixo." }
        };

        const embedExplicativa = new EmbedBuilder()
            .setColor(infoSetor[setor].cor)
            .setTitle(`📑 ORIENTAÇÕES: ${setor.toUpperCase()}`)
            .setDescription(`${infoSetor[setor].txt}\n\nDeseja abrir o ticket agora?`)
            .setFooter({ text: "Ao clicar abaixo, um canal privado será gerado." });

        const botaoConfirmar = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`ticket_${setor}`).setLabel('ABRIR TICKET').setStyle(ButtonStyle.Success).setEmoji('📩')
        );

        return interaction.reply({ embeds: [embedExplicativa], components: [botaoConfirmar], ephemeral: true });
    }

    // 📩 SUB-SISTEMA 2: Gerenciamento de Tickets (Abertura com Categoria e STAFF)
    if (interaction.isButton() && interaction.customId.startsWith('ticket_')) {
        const config = await db.get(`ticket_config_${interaction.guild.id}`);
        
        if (!config) {
            return interaction.reply({ 
                content: "⚠️ **ERRO DE CONFIGURAÇÃO:** O sistema de tickets ainda não foi configurado neste servidor.\nUse `d!setup-ticket` primeiro.", 
                ephemeral: true 
            });
        }

        const type = interaction.customId.split('_')[1].toUpperCase();
        const channelName = `${type.toLowerCase()}-${interaction.user.username}`;

        const alreadyOpen = interaction.guild.channels.cache.find(c => c.name === channelName.toLowerCase());
        if (alreadyOpen) return interaction.reply({ content: `⚠️ **ALERTA:** Você já possui um protocolo ativo em ${alreadyOpen}`, ephemeral: true });

        try {
            const ticketChannel = await interaction.guild.channels.create({
                name: channelName,
                type: ChannelType.GuildText,
                parent: config.category,
                permissionOverwrites: [
                    { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                    { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles] },
                    { id: config.staffRole, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles] },
                    { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
                ],
                topic: `ID do Solicitante: ${interaction.user.id} | Setor: ${type} | Logs: ${config.logChannel}`
            });

            if (interaction.replied || interaction.deferred) {
                await interaction.editReply({ content: `✅ **Protocolo iniciado no setor ${type}:** ${ticketChannel}`, embeds: [], components: [] });
            } else {
                await interaction.reply({ content: `✅ **Protocolo iniciado no setor ${type}:** ${ticketChannel}`, ephemeral: true });
            }

            const welcomeEmbed = new EmbedBuilder()
                .setColor("#2B2D31")
                .setAuthor({ name: `PROTOCOLO DE ${type}`, iconURL: interaction.user.displayAvatarURL() })
                .setDescription(
                    "```ansi\n" +
                    `• SOLICITANTE: \u001b[1;37m${interaction.user.username}\u001b[0m\n` +
                    `• STATUS:      \u001b[1;32mAQUARDANDO STAFF\u001b[0m\n` +
                    "```\n" +
                    "Descreva sua situação com detalhes e envie provas (prints) se necessário."
                )
                .setFooter({ text: "Use os botões abaixo para gerenciar o chamado." });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('close_ticket').setLabel('Fechar Protocolo').setStyle(ButtonStyle.Danger).setEmoji('🔒'),
                new ButtonBuilder().setCustomId('save_transcript').setLabel('Gerar Log').setStyle(ButtonStyle.Secondary).setEmoji('📜')
            );

            await ticketChannel.send({ content: `${interaction.user} | <@&${config.staffRole}>`, embeds: [welcomeEmbed], components: [row] });

        } catch (err) {
            console.error("Erro ao criar canal de ticket:", err);
            interaction.reply({ content: "❌ **ERRO:** Não consegui criar o canal de ticket. Verifique as permissões de categoria.", ephemeral: true });
        }
    }

    // 🔒 SUB-SISTEMA 3: Fechamento e Log de Tickets
    if (interaction.isButton() && interaction.customId === 'close_ticket') {
        const config = await db.get(`ticket_config_${interaction.guild.id}`);
        const logChannel = interaction.guild.channels.cache.get(config?.logChannel);

        if (logChannel) {
            const logEmbed = new EmbedBuilder()
                .setColor("#FF0000")
                .setTitle("📄 PROTOCOLO ENCERRADO")
                .setDescription(
                    "```ansi\n" +
                    `• CANAL:       \u001b[1;37m${interaction.channel.name}\u001b[0m\n` +
                    `• FECHADO POR: \u001b[1;31m${interaction.user.tag}\u001b[0m\n` +
                    "```"
                )
                .setTimestamp();
            await logChannel.send({ embeds: [logEmbed] });
        }

        await interaction.reply("🔒 **Protocolo encerrado. O canal será deletado em 5 segundos...**");
        setTimeout(() => interaction.channel.delete().catch(() => null), 5000);
    }

    if (interaction.isButton() && interaction.customId === 'save_transcript') {
        const messages = await interaction.channel.messages.fetch({ limit: 100 });
        const transcript = messages.reverse().map(m => `${m.author.tag}: ${m.content}`).join('\n');
        const attachment = new AttachmentBuilder(Buffer.from(transcript), { name: `log-${interaction.channel.name}.txt` });
        
        await interaction.reply({ content: "📜 **Log de conversa gerado:**", files: [attachment], ephemeral: true });
    }
});

// --- EXECUÇÃO DE MENSAGENS (PREFIXO + ANTI-LINK) ---
client.on('messageCreate', async message => {
    if (message.author.bot || !message.guild) return;

    try {
        await antiLinkSystem(client, message);
    } catch (err) {
        console.error('🚨 Erro no Módulo de Proteção:'.red, err);
    }

    if (!message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    
    const command = client.commands.get(commandName) || 
                    client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

    if (!command) return;

    try {
        console.log(`[PREFIX] ${message.author.tag} usou ${PREFIX}${commandName}`.magenta);
        message.user = message.author;
        
        const response = await command.run(message, args);

        // --- ADIÇÃO: AUTO-DELETE PARA COMANDO AJUDA (PREFIXO) ---
        if (commandName === 'ajuda' || commandName === 'help') {
            setTimeout(async () => {
                await message.delete().catch(() => null);
                if (response && response.delete) {
                    await response.delete().catch(() => null);
                } else {
                    const lastBotMsg = message.channel.messages.cache.filter(m => m.author.id === client.user.id).last();
                    if (lastBotMsg) await lastBotMsg.delete().catch(() => null);
                }
            }, 120000); // 2 minutos
        }
        else if (response && response.delete) {
            setTimeout(() => {
                response.delete().catch(() => null);
            }, 15000); 
        }

    } catch (error) {
        console.error(`🚨 Erro em ${PREFIX}${commandName}:`.red, error);
        const errorEmbed = new EmbedBuilder()
            .setColor("#FF0000")
            .setDescription(`❌ **FALHA NO COMANDO:** Houve um erro inesperado ao executar \`${commandName}\`.`);
        
        message.reply({ embeds: [errorEmbed] }).catch(() => null);
    }
});

// --- GERENCIAMENTO DE ERROS GLOBAIS (ANTI-CRASH) ---
process.on('unhandledRejection', (reason, promise) => {
    console.log('🚨 [ERRO_GLOBAL] Rejeição não tratada:'.red, reason);
});

process.on('uncaughtException', (err, origin) => {
    console.log('🚨 [ERRO_GLOBAL] Exceção não capturada:'.red, err, origin);
});

client.login(process.env.TOKEN);