import { Client } from 'discord.js'
import Bot from './bot'
import CommandParser from './command';

const client = new Client();

const parser = new CommandParser('-oof');

const bot = new Bot(parser, client);

bot.use('coolbot', 'This is a cool command', (message, args) => { console.log(args) }, ['string', 'number']);

client.login('NTE4NDcyMjM2NjQyOTkyMTI4.XtTwSQ.k0evizcVmP14EHut3Ze7B6HV86E');