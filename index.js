const TelegramBot = require('node-telegram-bot-api');
const request = require("request");
require('dotenv').config();

//const token = '1103111485:AAEKjdNi68aQY7_1vDpke-M75HmQXJP2kbw';
const token = process.env.TOKEN;
//Created instance of TelegramBot
const bot = new TelegramBot(token, {
   polling: true
});

const print_data = ['Title','Season','Episode','Year','Rated','Released','Runtime','Genre','Director','Actors','Plot','Language',
                    'Awards', 'imdbRating', 'Production', 'Poster'];

const getData = (params)=>{
    let url = 'http://www.omdbapi.com/?&apikey=b19c8e2a';
    url += '&t=' + params.title.replace(' ','+');
    if(params.season)url+=`&season=${params.season}`;
    if(params.episode)url+=`&episode=${params.episode}`;
    url += '&plot=full'
    console.log(url)
    const options = {
        method: 'GET',
        url: url
    };

    return new Promise((resolve,reject)=>{
        request(options, async function (error, response, body) {
            if (error) return reject(error);
            data = JSON.parse(body)
            //console.log(data.Episodes);
            resolve(data)
        });
    })

}

const printData = (data)=>{
    let message = '';
    for(let pd of print_data){
        if(data[pd])
            message += `${pd} : ${data[pd]}\n\n`;
    }
    return message;
}


// getData({title : 'joker'}).then(data=>console.log(data))



bot.onText(/.+/, async (msg, match) => {
    const chatId = msg.chat.id;
    const url = match.input;
    // 'msg' is the received Message from Telegram
    // 'match' is the result of executing the regexp above on the text content
    // of the message
    data = await getData({title : `${url}`})
    if (url === undefined || data.Response == 'False') {
        bot.sendMessage(
            chatId,
            'Please provide name of movie or TV show or not found',
        );
        return;
    }

    console.log(url)
    console.log(data)

    if(data['totalSeasons']){
        let seasons = Number(data['totalSeasons']);
        let layout = [];
        for(let i = 0;i < seasons/6;i++)layout.push([])
        for(let i = 1;i <= seasons;i++){
            layout[Math.floor((i-1)/6)].push({
                text : `S${i}`,
                callback_data : `${data['Title']}:${i}`
            })
        }
        bot.sendMessage(
            chatId,
            printData(data),
            {
                reply_markup : {
                    inline_keyboard : layout
                }
            }
        );
    }
    else{
        bot.sendMessage(
            chatId,
            printData(data),
        );
    }
 });

 bot.on('callback_query', async(callbackQuery) => {
    const message = callbackQuery.message;
    let call_data = callbackQuery.data.split(':');

    if(call_data.length != 2)return;

    console.log(callbackQuery.data)
 
    let data = await getData({title : call_data[0], season : call_data[1]})

    let layout = [];

    console.log(data)

    for(let episode of data.Episodes){
        layout.push([{
            text : `${episode.Episode} : ${episode.Title}`,
            callback_data : `${data['Title']}:${data['Season']}:${episode.Episode}`
        }]);
    }
 
    bot.sendMessage(message.chat.id,
                    `Title : ${data['Title']}\n\nSeason : ${data['Season']}`,
                    {
                        reply_markup : {
                            inline_keyboard : layout
                        }
                    });
});

bot.on('callback_query', async(callbackQuery) => {
    const message = callbackQuery.message;
    let call_data = callbackQuery.data.split(':');

    if(call_data.length != 3)return;

    console.log(callbackQuery.data)
 
    let data = await getData({title : call_data[0], season : call_data[1], episode : call_data[2]});

    console.log(data)

    bot.sendMessage(message.chat.id,
                    printData(data)
                );
});