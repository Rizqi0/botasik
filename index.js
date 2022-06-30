const Discord = require('discord.js');
const ytdl = require('ytdl-core');
const Youtube = require(`simple-youtube-api`);
const prefix = "-";

const client = new Discord.Client({
    disableEvryone: true
});

const youtube = new Youtube("AIzaSyDpR40cflVitPddy-8_liTsJyA4k5eO6kY")

const queue = new Map()

client.on("ready" , () => {
    console.log("Online!")
    client.user.setActivity()
})

clien.on("message", async Message =>{
    if(message.author.bot) return
    if(-message.content.startsWitch(prefix)) return

    const args = message.content.substaring(prefix.length).split(" ")
    const searchString = args.slice(1).join(" ")
    const url = args [1] ? args[1].replace(/<(.+)>/g,'$1') :''
    const serverQueue = queue.get(message.guild.id)

    if(message.content.startsWitch(`$(prefix)play`)){
        const voiceChannel = message.member.voice.channel
        if(!voiceChannel)return message.channel.send("Lu dimana anj?")
        const permission = voiceChannel.permissionFor(message.client.user)
        if(!permission.has('CONNECT'))return message.channel.send("Owner nya gk ngebolehin masuk anj")
        if(!permission.has('SPEAK'))return message.channel.send("Ownernya suka matiin mic")

        try {
            var video = await youtube.getVideoByID(url)
        }
        catch{
            try {
                var videos = await youtube.searchVideos(searchString,1)
                var video = await youtube.getVideoByID(videos[0].id)
            }
            catch {
                return message.channel.send("mau lu apa anj?")
            }
        }
        const song ={
            id: video.id,
            title: video.title,
            url: `https://www.youtube.com/watch?v=${video.id}`
        }
        if(!serverQueue){
            const queueConstruct = {
                textchannel: message.channel,
                voiceChannel: voiceChannel,
                connection: null,
                volume: 5,
                playing: true
            }
            queue.set(message.guild.id, queueConstruct)

            queueConstruct.song.push(song)

            try {
                var connection = await voiceChannel.join()
                queueConstruct.connection = connection
                play(message, queueConstruct.song[0])

            }
            catch (error){
                console.log(`lagi sakit: ${error}`)
                queue.delete(message.guild.id)
                return message.channel.send(`nggk bisa join:${error}`)
            }
        
        } else {
            serverQueue.song.push(song)
            return message.channel.send(`**$(song.title)** sudah di tambah`)
        }
        return undefined
    } else if(message.content.startsWitch(`${prefix}stop`)) {
        if(!message.member.voice.channel) return message.channel.send("jan iseng anj")
        if(!serverQueue) return message.channel.send("udah gk ada yang bisa di play")
        serverQueue.song =[]
        serverQueue.connection.dispatcher.end()
        message.channel.send("udah ku matiin musiknya")
        return undefined
    } else if(message.content.startsWitch(`${prefix}skip`)) {
        if(!message.member.voice.channel) return message.channel.send("jan iseng anj")
        if(!serverQueue) return message.channel.send("udah gk ada yang bisa di play")
        serverQueue.connection.dispatcher.end()
        message.channel.send("lanjut")
        return undefined
    } else if(message.content.startsWitch(`${prefix}volume`)) {
        if(!message.member.voice.channel) return message.channel.send("jan iseng anj")
        if(!serverQueue) return message.channel.send("udah gk ada yang bisa di play")
        if(args[1]) return message.channel.send(`noh liat **$(serverQueue.volume)**`)
        if(isNaN(args[1])) return message.channel.send("pake angka cok")
        serverQueue.volume = args[1]
        serverQueue.connection.dispatcher.setVolumeLogaritmic(args[1]/ 5)
        message.channel.send("apa masih kurang **${args[1]}**")
        return undefined
    } else if(message.content.startsWitch(`${prefix}now`)) {
        if(!serverQueue) return message.channel.send("udah gk ada yang bisa di play")
        message.channel.send(`noh yang lagi di play **${serverQueue.song[0].title}**`)
        return undefined
    } else if(message.content.startsWitch(`${prefix}queue`)) {
        if(!serverQueue) return message.channel.send("udah gk ada yang bisa di play")
        message.channel.send(`
__**Song Queue**__
${serverQueue.songs.map(song => `**-** ${song.title}`).join('\n')}
**Now PLaying:** ${serverQueue.songs[0].title}
        `, {split: true})
        return undefined
    }  else if(message.content.startsWitch(`${prefix}stop`)) {
        if(!message.member.voice.channel) return message.channel.send("jan iseng anj")
        if(!serverQueue) return message.channel.send("udah gk ada yang bisa di play")
        if(!serverQueue.playing) return message.channel.send("udah lebih hening")
        serverQueue.playing = false
        serverQueue.connection.dispatcher.pause()
        message.channel.send("sebuah ketenangan sudah ku berikan")
        return undefined
    } else if(message.content.startsWitch(`${prefix}resume`)) {
        if(!message.member.voice.channel) return message.channel.send("jan iseng anj")
        if(!serverQueue) return message.channel.send("udah gk ada yang bisa di play")
        if(serverQueue.playing) return message.channel.send("keheningan mulai hilang")
        serverQueue.playing = true
        serverQueue.connection.dispatcher.resume()
        message.channel.send("terlalu lama hening tidaklah menyenangkan")
        return undefined
    }

})



function play(guild, song) {
    const serverQueue = queue.get(guild.id)

    if(!song) {
        serverQueue.voiceChannel.leave()
        queue.delete(guild.id)
        return
    }

    const dispatcher = serverQueue.connection.play(ytdl(song.url, {highWaterMark: 1 << 25}))
        .on('finish', () =>{
            play(guild,serverQueue.songs[0])
        })
        .on('error', error =>{
            console.log(error)
        })
        dispatcher.setVolumeLogaritmic(serverQueue.volume / 5)

        serverQueue.textchannel.send(` start playing: **${song.title}**`)
}


client.login("")
