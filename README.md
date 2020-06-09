# discord-framework

A simple framework for making discord bots using discord.js

# Why use this framework instead of using Discord.js directly?

This framework provides common discord bot functionality which you'd otherwise have to impliment yourself when using Discord.js directly. The framework provides a easy to use command parser that: 

- Allows you to register command handlers
  - Default command handlers that trigger for all commands
  - Handlers for spesific commands
  - Handlers can be chanined together for more complex logic
  - Handlers can be async and will still be called one after the other
- Parses additional arguments of the command to the correct datatype and format
  - Default parsers provided for string and number arguments
  - Custom parsers can be coded to parse more complex arguments

# Usage

# Initializing

```js
import { DiscordBot, CommandParser } from '@wykerd/discord-framework';
import { Client } from 'discord.js'; 

const client = new Client();
const parser = new CommandParser('-ex');

const bot = new DiscordBot(parser, client);

client.login(process.env.BOT_TOKEN);
```

# Handling Commands

The framework takes great inspiration from the Express.js framework in how it handles commands

Adding a new command handler is simple using the `DiscordBot.use` method

```js
bot.use('hello', 'Responds with hello, {name}', (message, args) => {
  message.channel.send(`Hello, ${args[0]}`);
}, ['string']);
```

Adding commands with aliases is done simularly but passing a array of command names instead:

```js
bot.use(['hello','hey','hi'], 'Responds with hello, {name}', (message, args) => {
  message.channel.send(`Hello, ${args[0]}`);
}, ['string']);
```
