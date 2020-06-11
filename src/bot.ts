import { Client } from "discord.js";
import CommandParser, { CommandHandler, CustomParser, DefaultCommandHandler, ConverseHelp } from "./command";
import { loadModel } from './nlp'

export default class DiscordBot {
    private client : Client;
    private parser : CommandParser;

    constructor (parser : CommandParser, client = new Client()) {
        this.client = client;
        this.parser = parser;
        this.client.on('message', this.parser.process);
        this.client.on('ready', () => console.log('Ready'));
    }

    public use (handler: DefaultCommandHandler) : void;
    public use (name: string | string[], handler: CommandHandler, parse: (string | CustomParser)[]) : void;
    public use (name: string | string[], description: string, handler: CommandHandler, parse: (string | CustomParser)[]) : void;

    public use () : void {
        if ((arguments.length > 2) && ((typeof arguments[0] === 'string') || (Array.isArray(arguments[0]) && typeof arguments[0][0] === 'string')) ) {
            if (arguments.length === 3 && typeof arguments[1] === 'function' && Array.isArray(arguments[2])) {
                return this.parser.add({
                    name: arguments[0],
                    handler: arguments[1],
                    parse: arguments[2]
                });
            }
            if (arguments.length === 4 && typeof arguments[1] === 'string' && typeof arguments[2] === 'function' && Array.isArray(arguments[3])) {
                return this.parser.add({
                    name: arguments[0],
                    description: arguments[1],
                    handler: arguments[2],
                    parse: arguments[3]
                });
            }
        } else if (arguments.length === 1 && typeof arguments[0] === 'function') {
            return this.parser.addDefault(arguments[0]);
        }
        throw new TypeError('Invalid arguments');
    }
    public converse (intent: string | string[], handler: CommandHandler) : void;
    public converse (intent: string | string[], help: ConverseHelp, handler: CommandHandler) : void;

    public converse () : void {
        if (arguments.length === 2 && ((typeof arguments[0] === 'string') || (Array.isArray(arguments[0]))) && typeof arguments[1] === 'function') {
            return this.parser.addConverse({
                handler: arguments[1],
                intent: arguments[0]
            });
        } else if (arguments.length === 2 && ((typeof arguments[0] === 'string') || (Array.isArray(arguments[0]))) && typeof arguments[2] === 'function' && typeof arguments[1] === 'object') {
            return this.parser.addConverse({
                handler: arguments[2],
                help: arguments[1],
                intent: arguments[0]
            });
        }
        throw new TypeError('Invalid arguments');
    }

    public model (...args: string[]) {
        return loadModel(...args);
    }
}