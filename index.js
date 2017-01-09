const Discord = require('discord.js');
const bot = new Discord.Client();
const config = require("./config.json");
const yt = require('ytdl-core');
var fs = require('fs');

const prefix = "$";

let queue = {};

bot.on('ready', () => {
    console.log(`The bot is ready, It is on ${bot.guilds.size} servers, for a total of ${bot.users.size} users.`);
	bot.user.setGame(`Im on ${bot.guilds.size} Servers || config is $`)

  let points = JSON.parse(fs.readFileSync('./points.json', 'utf8'));
  let userPoints = points[msg.author.id] ? points[msg.author.id].points : 0;
  let curLevel = Math.floor(0.1 * Math.sqrt(userPoints));

	// Load File
	fs.readFile('./playlist.json', function (err, data) {
		if (!err){
			queue = JSON.parse(data);
		}
	});
});

// GUILD EVENTS
bot.on('guildDelete', guild => {
    console.log(`I have left ${guild.name} at ${new Date()}`)
});

bot.on('guildCreate', guild => {
    guild.defaultChannel.sendmsg(`**Hello My name is Omega, Im your new discord bot**`);
});

bot.on('guildMemberAdd', member => {
    let guild = member.guild;
    guild.defaultChannel.sendmsg(`**Welcome ${member.user} to Omega Server!**`)
// 	var joinrole = member.guild.roles.find('name', 'Test');
//  member.addRole(joinrole);
});

bot.on('guildBanAdd', (guild, user) => {
	guild.defaultChannel.sendmsg(`${user.username} has just been banned`)
});

bot.on('guildBanRemove', (guild, user) => {
	guild.defaultChannel.sendmsg(`${user.username} has just been unbanned`)
});

bot.on('guildMemberRemove', member => {
    let guild = member.guild;
    guild.defaultChannel.sendmsg(`**Bye ${member.user}, Hope to see you again!**`)
});

bot.on('channelPinsUpdate', (channel, time) => {
	channel.guild.defaultChannel.sendmsg(`The pins for ${channel.name} Have been updated (${time})`);
});

bot.on('msgDeleteBulk', msgs => {
	console.log(`${msgs.size} was deleted!`);
});

bot.on('msg', (msg) => {

  if (msg.author.bot || !msg.content.startsWith(config)) {
    return; }

bot.on("msg", msg => {
  if(msg.author.bot) return; // always ignore bots!

  // if the points don't exist, init to 0;
  if(!points[msg.author.id]) points[msg.author.id] = {points: 0, level: 0};
    points[msg.author.id].points++;

    // And then, we save the edited file.
  fs.writeFile('./points.json', JSON.stringify(points), (err) => {if(err) console.error(err)});
});

let command = msg.content.split(' ')[0];
command = command.slice(config.length)

let args = msg.content.split(' ').slice(1);
/*
 if (msg.content.startsWith(config + 'join')) {
		let voiceChan = msg.member.voiceChannel;
		if (!voiceChan || voiceChan.type !== 'voice') {
			msg.channel.sendmsg('No').catch(error => msg.channel.sendmsg(error));
		} else if (msg.guild.voiceConnection) {
			msg.channel.sendmsg('I\'m already in a voice channel');
		} else {
			msg.channel.sendmsg('Joining...').then(() => {
				voiceChan.join().then(() => {
					msg.channel.sendmsg('Joined successfully.').catch(error => msg.channel.sendmsg(error));
				}).catch(error => msg.channel.sendmsg(error));
			}).catch(error => msg.channel.sendmsg(error));
		}
	} else

	if (msg.content.startsWith(config + 'leave')) {
		let voiceChan = msg.member.voiceChannel;
		if (!voiceChan) {
			msg.channel.sendmsg('I am not in a voice channel');
		} else {
			msg.channel.sendmsg('Leaving...').then(() => {
				voiceChan.leave();
			}).catch(error => msg.channel.sendmsg(error));
		}
	};
*/
	if (command === 'play'){

		if (queue[msg.guild.id] === undefined) return msg.channel.sendmsg(`Add some songs to the queue first with ${config}add`);

		if (!msg.guild.voiceConnection) return msg.channel.sendmsg(`Add the bot to a channel first!`);

		if (queue[msg.guild.id].playing) return msg.channel.sendmsg('Already Playing');

		let dispatcher;

		queue[msg.guild.id].playing = true;

		console.log(queue);

		(function play(song) {

			console.log(song);

			if (song === undefined) return msg.channel.sendmsg('Queue is empty').then(() => {

				queue[msg.guild.id].playing = false;

			});

			msg.channel.sendmsg(`Playing: **${song.title}** as requested by: **${song.requester}**`);

			dispatcher = msg.guild.voiceConnection.playStream(yt(song.url, { audioonly: true }), { passes : 3 }); // this number is how smooth it runs, Goes up to 5 higher the more internet bandwidth!

			let collector = msg.channel.createCollector(m => m);

			collector.on('msg', m => {

				if (m.content.startsWith(config + 'pause')) {

					msg.channel.sendmsg('paused').then(() => {dispatcher.pause();});

				} else if (m.content.startsWith(config + 'resume')){

					msg.channel.sendmsg('resumed').then(() => {dispatcher.resume();});

				} else if (m.content.startsWith(config + 'skip')){

					msg.channel.sendmsg('skipped').then(() => {dispatcher.end();});

				} else if (m.content.startsWith('volume+')){

					if (Math.round(dispatcher.volume*50) >= 100) return msg.channel.sendmsg(`Volume: ${Math.round(dispatcher.volume*50)}%`);

					dispatcher.setVolume(Math.min((dispatcher.volume*50 + (2*(m.content.split('+').length-1)))/50,2));

					msg.channel.sendmsg(`Volume: ${Math.round(dispatcher.volume*50)}%`);

				} else if (m.content.startsWith('volume-')){

					if (Math.round(dispatcher.volume*50) <= 0) return msg.channel.sendmsg(`Volume: ${Math.round(dispatcher.volume*50)}%`);

					dispatcher.setVolume(Math.max((dispatcher.volume*50 - (2*(m.content.split('-').length-1)))/50,0));

					msg.channel.sendmsg(`Volume: ${Math.round(dispatcher.volume*50)}%`);

				} else if (m.content.startsWith(config + 'time')){

					msg.channel.sendmsg(`time: ${Math.floor(dispatcher.time / 60000)}:${Math.floor((dispatcher.time % 60000)/1000) <10 ? '0'+Math.floor((dispatcher.time % 60000)/1000) : Math.floor((dispatcher.time % 60000)/1000)}`);

				}

			});

			dispatcher.on('end', () => {

				collector.stop();

				queue[msg.guild.id].songs.shift();

				play(queue[msg.guild.id].songs[0]);

			});

			dispatcher.on('error', (err) => {

				return msg.channel.sendmsg('error: ' + err).then(() => {

					collector.stop();

					queue[msg.guild.id].songs.shift();

					play(queue[msg.guild.id].songs[0]);


				});

			});

		})(queue[msg.guild.id].songs[0]);
	} else

	if (command === 'join'){
		return new Promise((resolve, reject) => {

			const voiceChannel = msg.member.voiceChannel;

			if (!voiceChannel || voiceChannel.type !== 'voice') return msg.reply('I couldn\'t connect to your voice channel...');

			voiceChannel.join().then(connection => resolve(connection)).catch(err => reject(err));

		});
	} else

	if (command === 'add'){
		let url = msg.content.split(' ')[1];

		if (url == '' || url === undefined) return msg.channel.sendmsg(`You must add a url, or youtube video id after ${config}add`);

		yt.getInfo(url, (err, info) => {

			if(err) return msg.channel.sendmsg('Invalid YouTube Link: ' + err);

			if (!queue.hasOwnProperty(msg.guild.id)) queue[msg.guild.id] = {}, queue[msg.guild.id].playing = false, queue[msg.guild.id].songs = [];

			queue[msg.guild.id].songs.push({url: url, title: info.title, requester: msg.author.username});

			msg.channel.sendmsg(`added **${info.title}** to the queue`);

			fs.writeFile('./playlist.json', JSON.stringify(queue) , 'utf-8');

		});
	} else

	if (command === 'queue'){

		if (queue[msg.guild.id] === undefined) return msg.channel.sendmsg(`Add some songs to the queue first with ${config}add`);

		let tosend = [];

		queue[msg.guild.id].songs.forEach((song, i) => { tosend.push(`${i+1}. ${song.title} - Requested by: ${song.requester}`);});

		msg.channel.sendmsg(`__**${msg.guild.name}'s Music Queue:**__ Currently **${tosend.length}** songs queued ${(tosend.length > 15 ? '*[Only next 15 shown]*' : '')}\n\`\`\`${tosend.slice(0,15).join('\n')}\`\`\``);

	} else

	if (command === 'musichelp'){
		let tosend = ['```xl', config + 'join : "Join Voice channel of msg sender"',	config + 'add : "Add a valid youtube link to the queue"', config + 'queue : "Shows the current queue, up to 15 songs shown."', config + 'play : "Play the music queue if already joined to a voice channel"', '', 'the following commands only function while the play command is running:'.toUpperCase(), config + 'pause : "pauses the music"',	config + 'resume : "resumes the music"', config + 'skip : "skips the playing song"', config + 'time : "Shows the playtime of the song."',	'volume+(+++) : "increases volume by 2%/+"',	'volume-(---) : "decreases volume by 2%/-"',	'```'];

		msg.channel.sendmsg(tosend.join('\n'));
	} else

	if (command === 'purge') {
			let amount = msg.content.split(" ").splice(1, 2).join(" ");
			if(isNaN(parseInt(amount))) {
				msg.channel.bulkDelete(100);
				msg.channel.sendmsg("Chat Cleared. Amount: 100");
				return;
			}
			if(amount > 100) {
				return msg.reply("Please choose a number between 1-100.");
			}
			msg.channel.bulkDelete(amount);
			msg.channel.sendmsg("Chat Cleared. Amount: " + amount);
      console.log(`Chat Cleared. Amount: ` + amount);
	} else

	if (command === 'say') {
    	if (config.silent == "on") {
      		msg.delete()
    }
   		msg.channel.sendmsg(args.join(" "));
	} else

    if (command === 'help') {
        msg.reply('Goto :link: To get the help you need!');
    } else

    if (command === 'ping') {
        msg.channel.sendmsg('pong');
    }

	// does nodemon manage the server so if it crashes it will restart it auto?, MM i actully dont know about that
});

bot.login(config.bottoken);
