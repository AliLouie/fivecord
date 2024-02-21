const { Client, GatewayIntentBits, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, PermissionsBitField, Collection } = require('discord.js');
const fetch = require('node-fetch');
const mysql = require('mysql');
const FiveM = require("fivem");
const axios = require('axios');
const cron = require('node-cron');
var Q3RCon = require('quake3-rcon');

const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');


const config = require('./config');
const { token, clientId, WEB_SERVICE_BASE_URL, SECRET_KEY, dbConfig, RconipServer, RconPassword } = config;

console.log('Token:', token);
console.log('Client ID:', clientId);
console.log('Web Service Base URL:', WEB_SERVICE_BASE_URL);
console.log('Secret Key:', SECRET_KEY);
const dbConnection = mysql.createConnection(dbConfig);


const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers],
});

const commands = [
  {
    name: 'deleteserver',
    description: 'Delete a Server and remove it from the database',
    dm_permission: 0,
  },
  {
    name: 'addserver',
    description: 'Insert an IP address and port into the database',
    type: 1,
    dm_permission: 0,
    options: [
      {
        name: 'ip',
        description: 'The IP address of the server',
        type: 3,
        required: true,
      },
      {
        name: 'port',
        description: 'The port of the server',
        type: 3,
        required: true,
      },
    ],
  },
  {
    name: 'setcfx',
    description: 'Insert an join url cfx',
    type: 1,
    dm_permission: 0,
    options: [
      {
        name: 'url',
        description: 'The url address of the server',
        type: 3,
        required: true,
      },
    ],
  },
  {
    name: 'toggleip',
    description: 'hide or show ip Address',
    dm_permission: 0,
  },
  {
    name: 'togglemonitor',
    description: 'hide or show Server Monitor',
    dm_permission: 0,
  },
  {
    name: 'playerlist',
    description: 'Get all Player List',
    dm_permission: 0,
  },
  {
    name: 'serverinfo',
    description: 'Show Server Information',
    dm_permission: 0,
  },
  {
    name: 'help',
    description: 'Show commands and more info',
    dm_permission: 0,
  },
  {
    name: 'premium',
    description: 'Show VIP features and buy Premium',
    dm_permission: 0,
  },
  {
    name: 'ping',
    description: 'Show Ping Latency',
    dm_permission: 0,
  },
  {
    name: 'info',
    description: 'Show Bot Info',
    dm_permission: 0,
  },
  {
    name: 'addsteamid',
    description: 'Insert an id for add whitelist',
    dm_permission: 0,
    type: 1,
    options: [
      {
        name: 'steamid',
        description: 'Player Steam id Ex: steam:110000132b7899c',
        type: 3,
        required: true,
      },
    ],
  },
  {
    name: 'removesteamid',
    description: 'Insert an id for remove whitelist',
    dm_permission: 0,
    type: 1,
    options: [
      {
        name: 'steamid',
        description: 'Player Steam id',
        type: 3,
        required: true,
      },
    ],
  },
  {
    name: 'searchuser',
    description: 'Search a User from Database to see Player Info',
    dm_permission: 0,
    type: 1,
    options: [
      {
        name: 'identifier',
        description: 'Your player identifier',
        type: 3,
        required: true,
      },
    ],
  },
  {
    name: 'rcon',
    description: 'Send a command in your Server Console',
    dm_permission: 0,
    type: 1,
    options: [
      {
        name: 'command',
        description: 'Command, Ex: say Salam!',
        type: 3,
        required: true,
      },
    ],
  },
];

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationCommands(clientId), 
      { body: commands },

    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();

  
  // Connect to the MySQL server
  dbConnection.connect((err) => {
    if (err) {
      console.error('Error connecting to MySQL:', err);
      return;
    }
    console.log('Connected to MySQL database');
  
    // Now that we're connected to the database, let's retrieve the server IP
    const selectQuery = 'SELECT ip_address, discord_channel_id FROM ip_list LIMIT 1'; // Adjust the query as needed
    dbConnection.query(selectQuery, (err, results) => {
      if (err) {
        console.error('Error retrieving IP address:', err);
      } else {
        startScheduledTask();
        if (results.length > 0) {
          const ipAddress = results[0].ip_address;
          const discordChannelId = results[0].discord_channel_id;
          
          // Create the FiveM server object with the retrieved IP address
          fivemServer = new FiveM.Server(ipAddress);
          console.log(`First FiveM Server IP set to: ${ipAddress}`);
  
          // Use discordChannelId as needed
          console.log(`First Discord Channel ID: ${discordChannelId}`);
          
          // Get the server status
          fivemServer.getServerStatus().then(data => console.log(data));
        } else {
          console.log('No IP address found in the database.');
        }
      }
    });
  });


client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  client.user.setActivity("/help | PantiGame.ir");
  const Guilds = client.guilds.cache.map(guild => guild.id);
  console.log(Guilds);
  console.log('Bot is ready :)');
});


client.on('guildCreate', (guild) => {
  const botPerms = [
    PermissionsBitField.Flags.Administrator,
  ];

  if (!guild.members.me.permissions.has(botPerms)) {
    console.log(`I need the permissions ${botPerms.join(', ')} for this demonstration to work properly in ${guild.name}, leaving...`);
    guild.leave()
      .then(() => console.log(`Left ${guild.name} due to lack of permissions.`))
      .catch(console.error);
  }

  const { id, name } = guild;

  const insertQuery = 'INSERT INTO guilds (guild_id, guild_name) VALUES (?, ?)';
  dbConnection.query(insertQuery, [id, name], (err, results) => {
    if (err) {
      console.error('Error inserting guild into the database:', err);
    } else {
      console.log(`Added guild ${name} (${id}) to the database.`);
    }
  });
});

const cooldowns = new Collection();
const adminPermissions = new PermissionsBitField(PermissionsBitField.Flags.Administrator);

//----- Slash Command System:
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName, options } = interaction;

if (!cooldowns.has(commandName)) {
  cooldowns.set(commandName, new Collection());
}

const now = Date.now();
const timestamps = cooldowns.get(commandName);
const defaultCooldownDuration = 120; // Cooldown (Sec)
const cooldownAmount = (commands.cooldown ?? defaultCooldownDuration) * 1000;

if (timestamps.has(interaction.user.id)) {
  const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;

  if (now < expirationTime) {
    const timeLeft = (expirationTime - now) / 1000;
    return interaction.reply(`Pleas wait ${timeLeft.toFixed(1)} Seconds to send command.`);
  }
}

timestamps.set(interaction.user.id, now);
setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);


  if (commandName === 'deleteserver') {

    if (interaction.member.permissions.has(adminPermissions)) {

      const channelIdToDelete = interaction.channel.id;


      const dbConnection = mysql.createConnection(dbConfig);


      dbConnection.connect((err) => {
        if (err) {
          console.error('Error connecting to the database:', err);
          return;
        }

        const deleteQuery = 'DELETE FROM ip_list WHERE discord_channel_id = ?';
        dbConnection.query(deleteQuery, [channelIdToDelete], (err, results) => {
          if (err) {
            console.error('Error deleting channel from the database:', err);
            interaction.reply('Error deleting channel.');
          } else {
            console.log(`Channel with ID ${channelIdToDelete} deleted from the database.`);
            interaction.reply(`Channel with ID ${channelIdToDelete} deleted successfully.`);
          }


          dbConnection.end();
        });
      });
    } else {
      await interaction.reply('You do not have permission to execute this command.');
    }
  }

  //-----
  //-----
  if (commandName === 'addserver') {

    if (!interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.Administrator)) {
          interaction.reply("The robot does not have the Administrator access to perform this command.");
          console.error('The bot does not have ADMINISTRATOR permission.');
          return;
        }
    if (interaction.member.permissions.has(adminPermissions)) {

    const ipAddress = options.getString('ip');
    const port = options.getString('port');
    const discordChannelId = interaction.channel.id;
                  
    const checkQuery = 'SELECT discord_channel_id FROM ip_list WHERE discord_channel_id = ? LIMIT 1';
    dbConnection.query(checkQuery, [discordChannelId], async (err, results) => {
      if (err) {
        console.error('Error checking Discord channel ID:', err);
        await interaction.reply('Error inserting IP address.');
      } else {
        if (results.length === 0) {
          const insertQuery = 'INSERT INTO ip_list (ip_address, port, discord_channel_id, server_name, server_description, server_tag, server_gamebuild) VALUES (?, ?, ?, ?, ?, ?, ?)';
          dbConnection.query(insertQuery, [ipAddress, port, discordChannelId, 'Undefined', 'Undefined', 'Undefined', 'Undefined', 'Undefined'], async (err, results) => {
            if (err) {
              console.error('Error inserting IP address:', err);
              await interaction.reply('Error inserting IP address.');
            } else {
              console.log('Inserted IP address and Discord Channel ID into the database');
              
              const serverAddress = `${ipAddress}:${port}`;
              fivemServer = new FiveM.Server(serverAddress);
              console.log(`FiveM Server IP updated to: ${serverAddress}`);
              
              try {
                const res = await fetch(`http://${ipAddress}:${port}/info.json`);
                const json = await res.json();
                const serverName = json.vars.sv_projectName;
                const serverDesc = json.vars.sv_projectDesc;
                const serverTag = json.vars.tags;
                const serverGameBuild = json.vars.sv_enforceGameBuild;
                
                const updateQuery = 'UPDATE ip_list SET server_name = ?, server_description = ?, server_tag = ?, server_gamebuild = ? WHERE discord_channel_id = ?';
                dbConnection.query(updateQuery, [serverName, serverDesc, serverTag, serverGameBuild, discordChannelId], (err, results) => {
                  if (err) {
                    console.error('Error updating server information:', err);
                  } else {
                    //console.log('Server information updated in the database');
                    interaction.reply('Your IP address has been registered successfully. After processing, the monitor information will be sent in a few minutes.');
                  }
                });
              } catch (fetchError) {
                //console.error('Error fetching server information:', fetchError); // for debug purposes
                await interaction.channel.send('Error connecting to the server. Make sure your IP and port are correct.');
              }
            }
          });
        } else {
          interaction.reply('This channel is already have a server \n Use the following command to remove the current server: \n /deleteserver');
        }
      }
    });
  } else {
    await interaction.reply('You do not have permission to execute this command.');
  }
  }
  // -----------

  //------------ cfx url
  if (commandName === 'setcfx') {
    if (interaction.member.permissions.has(adminPermissions)) {

    const value = interaction.options.getString('url');
    const discordChannelId = interaction.channel.id;
  

    const regexPattern = /^https:\/\/cfx\.re\/[^\/]+\/[^\/]+$/;
  
    if (!regexPattern.test(value)) {

      await interaction.reply('Your link is invalid. An example of a valid link: https://cfx.re/join/pgr21f');
      return;
    }
  

    const checkQuery = 'SELECT ip_address, port FROM ip_list WHERE discord_channel_id = ? LIMIT 1';
    dbConnection.query(checkQuery, [discordChannelId], async (err, results) => {
      if (err) {
        console.error('Error checking Discord channel ID:', err);
        await interaction.reply('Error setting the server cfx link.');
      } else {
        if (results.length === 0) {

          await interaction.reply('IP address and port are not set for this channel in the database. Please set them first.');
        } else {


          const updateQuery = 'UPDATE ip_list SET server_cfx = ? WHERE discord_channel_id = ?';
          dbConnection.query(updateQuery, [value, discordChannelId], (err, results) => {
            if (err) {
              console.error('Error updating server cfx link:', err);
              interaction.reply('Error setting the server cfx link.');
            } else {
              console.log('Server cfx link updated in the database');
              interaction.reply('Server cfx link has been set successfully.');
            }
          });
        }
      }
    });
  } else {
    await interaction.reply('You do not have permission to execute this command.');
  }
  }
  // ------------------
  if (commandName === 'toggleip') {
    if (interaction.member.permissions.has(adminPermissions)) {

    const discordChannelId = interaction.channel.id;
    

    const checkQuery = 'SELECT is_hide FROM ip_list WHERE discord_channel_id = ? LIMIT 1';
    dbConnection.query(checkQuery, [discordChannelId], async (err, results) => {
      if (err) {
        console.error('Error checking Discord channel ID:', err);
        await interaction.reply('Error toggling hide status.');
      } else {
        if (results.length === 0) {

          await interaction.reply('This channel is not registered in the database.');
        } else {

          const currentHideStatus = results[0].is_hide;
          const newHideStatus = !currentHideStatus;
  
          const updateQuery = 'UPDATE ip_list SET is_hide = ? WHERE discord_channel_id = ?';
          dbConnection.query(updateQuery, [newHideStatus, discordChannelId], (err, updateResults) => {
            if (err) {
              console.error('Error toggling hide status:', err);
              interaction.reply('Error toggling hide status.');
            } else {
              console.log('Hide status updated in the database');
              const statusText = newHideStatus ? 'hidden' : 'visible';
              interaction.reply(`Channel hide status has been set to ${statusText}.`);
            }
          });
        }
      }
    });
  } else {
    await interaction.reply('You do not have permission to execute this command.');
  }
  }
  //-----------------

  //-----------------
  if (commandName === 'togglemonitor') {
    if (interaction.member.permissions.has(adminPermissions)) {
    const discordChannelId = interaction.channel.id;
    

    const checkQuery = 'SELECT monitor FROM ip_list WHERE discord_channel_id = ? LIMIT 1';
    dbConnection.query(checkQuery, [discordChannelId], async (err, results) => {
      if (err) {
        console.error('Error checking Discord channel ID:', err);
        await interaction.reply('Error toggling hide status.');
      } else {
        if (results.length === 0) {

          await interaction.reply('This channel is not registered in the database');
        } else {

          const currentHideStatus = results[0].monitor;
          const newHideStatus = !currentHideStatus;
  
          const updateQuery = 'UPDATE ip_list SET monitor = ? WHERE discord_channel_id = ?';
          dbConnection.query(updateQuery, [newHideStatus, discordChannelId], (err, updateResults) => {
            if (err) {
              console.error('Error toggling hide status:', err);
              interaction.reply('Error toggling hide status.');
            } else {
              console.log('Hide status updated in the database');
              const statusText = newHideStatus ? 'Active' : 'Inactive';
              interaction.reply(`Your monitor status is ${statusText}.`);
            }
          });
        }
      }
    });
  } else {
    await interaction.reply('You do not have permission to execute this command.');
  }
  }
  //-----------------
  

  function splitMessage(message, maxChunkLength) {
    const chunks = [];
    let currentChunk = '';
  
    const lines = message.split('\n');
  
    for (const line of lines) {
      if (currentChunk.length + line.length + 1 <= maxChunkLength) {
        currentChunk += line + '\n';
      } else {
        chunks.push(currentChunk);
        currentChunk = line + '\n';
      }
    }
  
    if (currentChunk.length > 0) {
      chunks.push(currentChunk);
    }
  
    return chunks;
  }
  //-----------------
  if (commandName === 'playerlist') {
    if (interaction.member.permissions.has(adminPermissions)) {
    const discordChannelId = interaction.channel.id;


    const checkQuery = 'SELECT ip_address, port FROM ip_list WHERE discord_channel_id = ? LIMIT 1';
    dbConnection.query(checkQuery, [discordChannelId], async (err, results) => {
      if (err) {
        console.error('Error checking Discord channel ID:', err);
        await interaction.reply('Error fetching server information.');
      } else {
        if (results.length === 0) {

          await interaction.reply('This channel is not registered in the database');
        } else {

          const serverIp = results[0].ip_address;
          const serverPort = results[0].port;


          const fivemServer = new FiveM.Server(`${serverIp}:${serverPort}`);


          fivemServer.getPlayersAll()
            .then((players) => {
              if (players.length === 0) {
                interaction.reply('There are currently no players on the server.');
              } else {
                const playerList = players.map((player) => `${player.name} - id: ${player.id} - ${player.identifiers} \n --`).join('\n');

                const messageChunks = splitMessage(playerList, { maxLength: 1950 });


                messageChunks.forEach(async (chunk) => {
                  if (chunk.trim() !== '') {
                    await interaction.user.send(chunk);
                  }
                });
                


                interaction.reply('The list of players has been sent to your DM.')
              }
            })
            .catch((error) => {
              //console.error('Error fetching player list from Fivem server:', error); // for debug purposes
              interaction.reply('Error fetching player list from Fivem server, your server is offline.');
            });
        }
      }
    });
  } else {
    await interaction.reply('You do not have permission to execute this command.');
  }
  }
  //-----------------
  const wait = require('node:timers/promises').setTimeout;

  //-----------------
  if (commandName === 'serverinfo') {
    const discordChannelId = interaction.channel.id;
  

    const checkQuery = 'SELECT ip_address, port FROM ip_list WHERE discord_channel_id = ? LIMIT 1';
    dbConnection.query(checkQuery, [discordChannelId], async (err, results) => {
      if (err) {
        console.error('Error checking Discord channel ID:', err);
        await interaction.reply('Error fetching server information.');
      } else {
        if (results.length === 0) {

          await interaction.reply('This channel is not registered in the database');
        } else {

          const serverIp = results[0].ip_address;
          const serverPort = results[0].port;
  

          const fivemServer = new FiveM.Server(`${serverIp}:${serverPort}`);
  
          try {
            const serverName = await fivemServer.getServerName();
            const serverDesc = await fivemServer.getServerDesc();
            const serverPlayerCount = await fivemServer.getPlayers();
            const serverTags = await fivemServer.getTags();
            const serverGBuild = await fivemServer.getGameBuild();
            const formattedServerBuild = replaceServerBuild(serverGBuild);
  
            const embed = new EmbedBuilder()
              .setTitle(serverName)
              .setDescription(serverDesc)
              .addFields(
                { name: 'Players', value: serverPlayerCount.toString() },
                { name: 'Tags', value: serverTags },
                { name: 'GameBuild', value: formattedServerBuild },
              )
              .setAuthor({ name: 'Fivem Server Info', iconURL: 'https://dl2.pantigame.ir/images/v-logo-gif.gif' })
              .setTimestamp()
              .setFooter({ text: 'Dedicated Fivem Server', iconURL: 'https://dl2.pantigame.ir/images/FivemLogoGray.png' })
              .setThumbnail('https://dl2.pantigame.ir/images/OnlineStatus.png')
              .setColor('#0099ff');

              await interaction.deferReply();  
              await wait(4000);
            await interaction.editReply({ embeds: [embed] });
          } catch (error) {
            //console.error('Error fetching data from Fivem server:', error); // for debug purposes

            await interaction.channel.send('Error fetching data from Fivem server❌');
          }
        }
      }
    });
  }
  //-----------------

  if (commandName === 'help') {
    const embed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle('Help')
    .setURL('https://pantigame.ir/')
    .setDescription('Command List')
    .setThumbnail('https://dl2.pantigame.ir/images/LogoFiveCord1080x1080.png')
    .addFields(
      { name: '🔸Fivem Commands', value: '`/addserver`, `/deleteserver`, `/setcfx`, `/toggleip`, `/togglemonitor`, `/playerlist`, `/serverinfo`' },
      { name: '👑 Premium Commands', value: 'To see special features: `/premium`, \n `/addsteamid`, `/removesteamid`, `/searchuser`, `/rcon`' },
      { name: '🤖 Bot Commands', value: '`/help`, `/ping`, `/info`' },
      { name: '\u200B', value: '\u200B' },
      { name: 'Monitor Server', value: '24/7✅', inline: true },
      { name: 'Support CFX', value: 'Easy join to SV✅', inline: true },
      { name: 'Best Features', value: 'Easy to use✅', inline: true }
    )
    .setFooter({ text: 'FiveCord Bot • Made by AliLouie', iconURL: 'https://dl2.pantigame.ir/images/FivemLogoGray.png' })
    .setTimestamp()

  const joinButton = new ButtonBuilder()
  .setLabel('Join to Support')
  .setURL('https://discord.gg/3JwePnS')
  .setStyle(ButtonStyle.Link);

  const actionRow = new ActionRowBuilder().addComponents(joinButton);


  try {
    await interaction.reply({ embeds: [embed], components: [actionRow] });
  } catch (error) {
    //console.error('Error sending reply:', error);
    interaction.channel.send('Error sending reply❌');
  }
}
//---------------

if (commandName === 'premium') {
  const embed = new EmbedBuilder()
  .setColor('#0099ff')
  .setTitle('Premium Features')
  .setURL('https://pantigame.ir/')
  .setDescription('You can see the special features of the robot in this section.')
  .setThumbnail('https://dl2.pantigame.ir/images/LogoFiveCord1080x1080.png')
  .addFields(
    { name: 'Whitelist', value: '```Restrictions on the entry of players in the authorized list``` \n `/addsteamid` `/removesteamid`' },
    { name: 'Find Player Info', value: '```Viewing the complete information of the players through the server database``` \n `/searchuser`' },
    { name: 'Rcon', value: '```Send and receive commands to the server console through the robot``` \n `/rcon`' },
  )
  .setFooter({ text: 'FiveCord Bot • Made by PantiGame.ir', iconURL: 'https://dl2.pantigame.ir/images/FivemLogoGray.png' })
  .setTimestamp()

const joinButton = new ButtonBuilder()
.setLabel('Support')
.setURL('https://pantigame.ir/')
.setStyle(ButtonStyle.Link);

const actionRow = new ActionRowBuilder().addComponents(joinButton);


try {
  await interaction.reply({ embeds: [embed], components: [actionRow] });
} catch (error) {
  //console.error('Error sending reply:', error);
  interaction.channel.send('Error sending reply❌');
}
}
  
//---------------
if (commandName === 'ping') {
  const ping = Math.abs(Date.now() - interaction.createdTimestamp);

  const embed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle('Ping')
    .setDescription("Received a ping: `" + `${ping+"ms"}` + "`");

  await interaction.reply({ embeds: [embed] });
}
//---------------
if (commandName === 'info') {
  const uptime = client.uptime;

  let totalSeconds = (client.uptime / 1000);
let days = Math.floor(totalSeconds / 86400);
totalSeconds %= 86400;
let hours = Math.floor(totalSeconds / 3600);
totalSeconds %= 3600;
let minutes = Math.floor(totalSeconds / 60);
let seconds = Math.floor(totalSeconds % 60);

  const embed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle('FiveCord Bot')
    .setURL('https://pantigame.ir/')
    .setDescription('If you have any suggestion or find a bug, share it with the support')
    .setThumbnail('https://dl2.pantigame.ir/images/discodProfile.png')
    .addFields(
      { name: '* Uptime *', value: `${days} Days, ${hours} Hours, ${minutes} Mins and ${seconds} Sec`, inline: true },
      { name: '* Support *', value: 'https://discord.gg/3JwePnS', inline: true },
    )
    .setFooter({ text: 'FiveCord Bot • Made by PantiGame.ir', iconURL: 'https://dl2.pantigame.ir/images/FivemLogoGray.png' })
    .setTimestamp();

  const joinButton = new ButtonBuilder()
    .setLabel('Our Site')
    .setURL('https://pantigame.ir/')
    .setStyle(ButtonStyle.Link);

  const actionRow = new ActionRowBuilder().addComponents(joinButton);

  try {
    await interaction.reply({ embeds: [embed], components: [actionRow] });
  } catch (error) {
    //console.error('Error sending reply:', error);
    interaction.channel.send('Error sending reply❌');
  }
}

//---------------
  //-----------------
  //-----------------
  if (commandName === 'addsteamid') {

    const member = interaction.member;
    if (!member) {
      interaction.reply('Error: User information not found.');
      return;
    }

    const permissions = new PermissionsBitField(member.permissions);
    if (!permissions.has(PermissionsBitField.Flags.Administrator)) {
      interaction.reply('Error: You do not have Administrator access.');
      return;
    }

    const steamid = options.getString('steamid');

    if (!steamid) {
      interaction.reply('Please enter a Steam ID.');
      return;
    }


    const dataToInsert = {
      identifier: steamid,
      priority: '0',
    };


    try {
      const response = await axios.post(`${WEB_SERVICE_BASE_URL}/addData`, {dataToInsert}, { params: { key: SECRET_KEY } });
      console.log(response.data.message);
      interaction.reply('Steam ID saved successfully.');
    } catch (error) {
      console.error('Error sending data to the server:', error);
      interaction.reply('Error sending data to the server. The data already exists!');
    }
  }
  //-----------------
  if (commandName === 'removesteamid') {

    const member = interaction.member;
    if (!member) {
      interaction.reply('Error: User information not found.');
      return;
    }

    const permissions = new PermissionsBitField(member.permissions);
    if (!permissions.has(PermissionsBitField.Flags.Administrator)) {
      interaction.reply('Error: You do not have Administrator access.');
      return;
    }

    const steamid = options.getString('steamid');

    if (!steamid) {
      interaction.reply('Please enter a Steam ID.');
      return;
    }

    try {
      const response = await axios.delete(`${WEB_SERVICE_BASE_URL}/removeData/${steamid}`, { params: { key: SECRET_KEY } });
      console.log(response.data.message);
      interaction.reply('Steam ID saved successfully.');
    } catch (error) {
      console.error('Error deleting data from the server:', error);
      interaction.reply('Error deleting data from the server. There is no ID to delete!');
    }
  }
  //-----------------
  if (commandName === 'searchuser') {

    const member = interaction.member;
    if (!member) {
      interaction.reply('Error: User information not found.');
      return;
    }
  
    const permissions = new PermissionsBitField(member.permissions);
    if (!permissions.has(PermissionsBitField.Flags.Administrator)) {
      interaction.reply('Error: You do not have Administrator access.');
      return;
    }
  
    const identifier = options.getString('identifier');
  
    if (!identifier) {
      interaction.reply('Please enter a Steam ID.');
      return;
    }
  
    try {
      const response = await axios.get(`${WEB_SERVICE_BASE_URL}/get-user/${identifier}`, { params: { key: SECRET_KEY } });
      const userData = response.data.user;
  
      const embed = new EmbedBuilder()
        .setTitle('User information')
        .setDescription(userData.identifier)
        .setColor('#0099ff');
  
      if (userData.firstname) {
        embed.addFields(
          { name: 'Firstname', value: userData.firstname },
        );
      }
      if (userData.lastname) {
       embed.addFields(
        { name: 'Lastname', value: userData.lastname },
      );
      }

      if (userData.dateofbirth) {
        embed.addFields(
          { name: 'DOB', value: userData.dateofbirth },
        );
      }

      if (userData.accounts) {
        embed.addFields(
          { name: 'Accounts', value: userData.accounts },
        );
      }

      if (userData.group) {
        embed.addFields(
          { name: 'Group', value: userData.group },
        );
      }

      if (userData.job) {
        embed.addFields(
          { name: 'Job', value: userData.job },
        );
      }

      if (userData.position) {
        embed.addFields(
          { name: 'Position', value: userData.position },
        );
      }
  
      embed.setTimestamp();
      embed.setThumbnail('https://dl2.pantigame.ir/images/userinfo-discord-FC.png');
  

      interaction.reply({ embeds: [embed] });
  
    } catch (error) {
      console.error('Error to show data from the server:', error);
      interaction.reply('Error receiving Data. Please make sure your game server is on');
  
      const errorMessage = `Error receiving Data:\n\`\`\`json\n${JSON.stringify(error.response?.data, null, 2)}\n\`\`\``;
      interaction.channel.send(errorMessage);
    }
  }
  
  //-----------------
  if (commandName === 'rcon') {
    const member = interaction.member;
    const permissions = new PermissionsBitField(member.permissions);
    if (!permissions.has(PermissionsBitField.Flags.Administrator)) {
      interaction.reply('Error: You do not have Administrator access.');
      return;
    }
  
    const rconCommand = options.getString('command');
  
    if (!rconCommand) {
      interaction.reply('Please provide an RCON command.');
      return;
    }
  
    axios.get(`http://${RconipServer}:30120/info.json`)
      .then((response) => {
        if (response.status === 200 && response.data) {

          try {

            var rcon = new Q3RCon({
              address: `${RconipServer}`,
              port: 30120,
              password: `${RconPassword}`,
              debug: false,
            });
  

            rcon.send(rconCommand, function (rconResponse) {
              const embed = new EmbedBuilder()
                .setTitle(`RCON Response:`)
                .setDescription(`\`\`\`css\n${rconResponse.slice(6)}\`\`\``)
                .setColor('#800080');
              interaction.reply({ embeds: [embed] });
            });
          } catch (error) {
            //console.error('RCON Error:', error);
            interaction.reply('An error occurred while sending the RCON command.');
          }
        } else {
          interaction.reply('The RCON server is offline.');
        }
      })
      .catch((error) => {
        //console.error('HTTP Request Error:', error);
        interaction.reply('An error occurred to connect to the server, make sure the server is on.');
      });
  }


//-------------------
});
///------ END

//---------------
// Check whether the server is online or offline
//-------------------
const updateServerStatus = async () => {
  try {

    const selectQuery = 'SELECT ip_address, port FROM ip_list';
    dbConnection.query(selectQuery, async (err, results) => {
      if (err) {
        console.error('Error retrieving server list from the database:', err);
        return;
      }


      for (const result of results) {
        const ipAddress = result.ip_address;
        const port = result.port;
        const serverKey = `${ipAddress}:${port}`;

        const serverStatus = await getServerStatus(ipAddress, port);


        const updateQuery = 'UPDATE ip_list SET is_online = ? WHERE ip_address = ? AND port = ?';
        dbConnection.query(updateQuery, [serverStatus, ipAddress, port], (err, updateResults) => {
          if (err) {
            console.error('Error updating server status in the database:', err);
          } else {
            //console.log(`Server ${serverKey} is ${serverStatus ? 'online' : 'offline'}`); //for debug purposes
          }
        });
      }
    });
  } catch (error) {
    console.error('Error updating server statuses:', error);
  }
};


const getServerStatus = async (ipAddress, port) => {
  try {
    const response = await axios.get(`http://${ipAddress}:${port}/info.json`, { timeout: 5000 });
    return true;
  } catch (error) {
    return false;
  }
};


const interval = 1 * 60 * 1000; // Minute
setInterval(updateServerStatus, interval);
//------------------- END


// Check Player Count
//-------------------
const updatePlayerCount = async () => {
  try {

    const selectQuery = 'SELECT ip_address, port FROM ip_list';
    dbConnection.query(selectQuery, async (err, results) => {
      if (err) {
        console.error('Error retrieving server list from the database:', err);
        return;
      }


      for (const result of results) {
        const ipAddress = result.ip_address;
        const port = result.port;
        const serverKey = `${ipAddress}:${port}`;

        const serverStatus = await getServerPlayerCount(ipAddress, port);


        const updateQuery = 'UPDATE ip_list SET player_count = ? WHERE ip_address = ? AND port = ?';
        dbConnection.query(updateQuery, [serverStatus, ipAddress, port], (err, updateResults) => {
          if (err) {
            console.error('Error updating server status in the database:', err);
          } else {
            //console.log(`Server ${serverKey} Player Count is ${serverStatus}`); // for debug purposes
          }
        });
      }
    });
  } catch (error) {
    console.error('Error updating server statuses:', error);
  }
};


const getServerPlayerCount = async (ipAddress, port) => {
  try {
    const response = await axios.get(`http://${ipAddress}:${port}/dynamic.json`, { timeout: 5000 });

    if (response.status === 200) {
      const jsonData = response.data;
      const clients = jsonData.clients;
      return clients;
    } else {
      return 'Error 400';
    }
  } catch (error) {
    return 'Error 404';
  }
};


const intervalPlayerCount = 1 * 60 * 1000; // Minute
setInterval(updatePlayerCount, intervalPlayerCount);
//------------------- END


const channelData = {};

client.on('messageDelete', (deletedMessage) => {

  if (deletedMessage.author.id === client.user.id) {

    const channelId = deletedMessage.channel.id;
    if (channelData[channelId]) {
      delete channelData[channelId];
    }
  }
});

function replaceServerBuild(serverBuild) {
  serverBuild = serverBuild.replace(/1604/g, 'Arena War');
  serverBuild = serverBuild.replace(/2060/g, 'Los Santos Summer Special');
  serverBuild = serverBuild.replace(/2189/g, 'Cayo Perico Heist');
  serverBuild = serverBuild.replace(/2372/g, 'Los Santos Tuners');
  serverBuild = serverBuild.replace(/2545/g, 'The Contract');
  serverBuild = serverBuild.replace(/2612/g, 'mpg9ec');
  serverBuild = serverBuild.replace(/2699/g, 'The Criminal Enterprises');
  serverBuild = serverBuild.replace(/2802/g, 'Los Santos Drug Wars');
  serverBuild = serverBuild.replace(/2944/g, 'San Andreas Mercenaries');
  
  return serverBuild;
}

function replaceIsOnline(serverIsOnline) {
  if (serverIsOnline === '1') {
    return 'https://dl2.pantigame.ir/images/OnlineStatusEn.png';
  } else if (serverIsOnline === '0') {
    return 'https://dl2.pantigame.ir/images/OfflineStatusEn.png';
  }

  return 'https://dl2.pantigame.ir/images/unknown-1.1s-200px.png';
}

function replaceServerPCount(serverPCount) {
  serverPCount = serverPCount.replace(/^0$/g, 'No Player');

  
  return serverPCount;
}



const sendServerStatus = async () => {
  try {

    const selectQuery = 'SELECT discord_channel_id, ip_address, port, server_name, server_description, server_tag, server_gamebuild, is_online, player_count, monitor, server_cfx, is_hide FROM ip_list';
    dbConnection.query(selectQuery, async (err, results) => {
      if (err) {
        console.error('Error retrieving server list from the database:', err);
        return;
      }


      for (const result of results) {
        const channelId = result.discord_channel_id;
        const monitor = result.monitor;


        if (monitor) {
          const ipAddress = result.ip_address;
          const port = result.port;
          const serverName = result.server_name;
          const serverDescription = result.server_description;
          const serverTag = result.server_tag;
          const serverBuild = result.server_gamebuild;
          const formattedServerBuild = replaceServerBuild(serverBuild);
          const serverIsOnline = result.is_online;
          const formattedIsOnline = replaceIsOnline(serverIsOnline);
          const serverPCount = result.player_count;
          const formattedServerPCount = replaceServerPCount(serverPCount);
          const serverCfx = result.server_cfx;
          const HideIp = result.is_hide;


          const embed = new EmbedBuilder()
            .setTitle(serverName)
            .setURL(`${serverCfx}`)
            .setDescription(serverDescription)
            if (!HideIp) {
              embed.addFields(
                { name: 'IP Address', value: ipAddress },
                { name: 'Port', value: port },
              );
            }
  
            embed.addFields(
              { name: 'Players', value: formattedServerPCount },
              { name: 'Tags', value: serverTag },
              { name: 'GameBuild', value: formattedServerBuild },
            )
            .setAuthor({ name: 'Fivem Server Info', iconURL: 'https://dl2.pantigame.ir/images/v-logo-gif.gif' })
            .setTimestamp()
            .setFooter({ text: 'Dedicated Fivem Server', iconURL: 'https://dl2.pantigame.ir/images/FivemLogoGray.png' })
            .setThumbnail(formattedIsOnline)
            .setColor('#ffa600');

          const joinButton = new ButtonBuilder()
          .setLabel('Join to Server🌆')
	        .setURL(`${serverCfx}`)
	        .setStyle(ButtonStyle.Link);


          const actionRow = new ActionRowBuilder().addComponents(joinButton);


          const existingMessage = channelData[channelId];
          const channel = client.channels.cache.get(channelId);

          if (!channel) {
            console.error(`Channel with ID ${channelId} not found.`);
            continue;
          }

          if (existingMessage) {
            existingMessage.edit({ embeds: [embed], components: [actionRow] }).catch(console.error);
          } else {
            channel.send({ embeds: [embed], components: [actionRow] }).then((sentMessage) => {
              channelData[channelId] = sentMessage;
            }).catch(console.error);
          }
        }
      }
    });
  } catch (error) {
    console.error('Error updating server statuses:', error);
  }
};




const intervalTime = 1 * 60 * 1000; // Minute
setInterval(sendServerStatus, intervalTime);


//----------------



function startScheduledTask() {

  cron.schedule('*/40 * * * *', async () => {

    const checkQuery = 'SELECT discord_channel_id FROM ip_list';
    dbConnection.query(checkQuery, (err, results) => {
      if (err) {
        console.error('Error checking Discord channels in the database:', err);
      } else {

        for (const row of results) {
          const channelId = row.discord_channel_id;


          const channel = client.channels.cache.get(channelId);
          if (!channel) {

            const deleteQuery = 'DELETE FROM ip_list WHERE discord_channel_id = ?';
            dbConnection.query(deleteQuery, [channelId], (err) => {
              if (err) {
                console.error('Error deleting channel from the database:', err);
              } else {
                console.log(`Deleted channel with ID ${channelId} from the database.`);
              }
            });
          } else if (!channel.permissionsFor(client.user).has('VIEW_CHANNEL')) {

            const deleteQuery = 'DELETE FROM ip_list WHERE discord_channel_id = ?';
            dbConnection.query(deleteQuery, [channelId], (err) => {
              if (err) {
                console.error('Error deleting channel from the database:', err);
              } else {
                console.log(`Deleted channel with ID ${channelId} from the database.`);
              }
            });
          }
        }
      }
    });
  });
}




client.login(token);