import { Message } from 'discord.js'
import assert from 'assert'
import { processMessage } from './nlp';

export type CommandHandler = (message: Message, args : any[], converse_result?: any) => Promise<boolean> | boolean;

export type CustomParser = (value: string) => any; 

export interface Command {
    name: string | string[];
    description?: string;
    handler: CommandHandler;
    parse: (string | CustomParser)[];
}

export interface ConverseHelp {
    example: string;
    description: string;
}

export interface ConverseCommand {
    intent: string | string[];
    help?: ConverseHelp;
    handler: CommandHandler;
}

export type ErrorHandler = (message: Message, error: any) => string;

export type DefaultCommandHandler = (message: Message, commands: Command[] | ConverseCommand[]) => Promise<boolean> | boolean;

export interface NlpOptions {
    min_confidence: number;
    must_include?: string[]
}

export default class CommandParser {
    private commands : Command[];
    private converseCommands : ConverseCommand[];
    private prefix : string;
    private split : string;
    private defaults : DefaultCommandHandler[];
    private errorHandler : ErrorHandler;
    public nlp : NlpOptions = {
        min_confidence: 0.5
    };

    constructor (
        prefix: string, 
        split : string = ' ', 
        commands: Command[] = [], 
        defaults: DefaultCommandHandler[] = [], 
        converseCommands : ConverseCommand[] = []
    ) {
        this.commands = commands;
        this.prefix = prefix;
        this.split = split;
        this.defaults = defaults;
        this.converseCommands = converseCommands;
        this.add = this.add.bind(this);
        this.addDefault = this.addDefault.bind(this);
        this.parseArguments = this.parseArguments.bind(this);
        this.call = this.call.bind(this);
        this.process = this.process.bind(this);
        this.errorHandler = (function (message : Message, error : any) {
            return `<@${message.author.id}> Error: ${error?.message ?? 'Unknown error.'}`;
        }).bind(this);
    }

    public error (handler: ErrorHandler) {
        this.errorHandler = handler.bind(this);
    }

    public add(command : Command) {
        this.commands.push(command);
    }

    public addConverse (command: ConverseCommand) {
        this.converseCommands.push(command);
    }

    public addDefault(handler : DefaultCommandHandler) {
        this.defaults.push(handler);
    }

    private parseArguments(argv: string[], parse: (string | CustomParser)[], offset: number = 2) : any[] {
        const parsed_args : any[] = [];
        let arg_i = offset;

        for (let i = 0; i < parse.length; i++) {
            assert(arg_i < argv.length, `Invalid amount of arguments: Expected ${parse.length} got ${parsed_args.length}.`);
            const parse_type = parse[i];
            // Custom parser
            if (typeof parse_type === 'function') {
                const parsed = parse_type(argv[arg_i]);
                assert(parsed !== undefined, `Could not parse argument ${argv[arg_i]} using custom parser.`); 
                parsed_args.push(parsed);
                arg_i++;
                continue;
            }
            // Built-in parsers
            if (typeof parse_type === 'string') {
                switch (parse_type) {
                    case 'string':
                        {
                            let parsed: string = argv[arg_i];
                            if (['"', "'"].includes(parsed.charAt(0))) {
                                // extended string
                                const escape = parsed.charAt(0);
                                for (let i = arg_i; i < argv.length; i++) {
                                    const str = argv[i];
                                    if (str.charAt(str.length - 1) === escape) {
                                        parsed = [...argv].splice(arg_i, i - arg_i + 1).join(this.split);
                                        parsed = parsed.substr(1, parsed.length - 2);
                                        arg_i = i;
                                        break;
                                    }
                                }
                                arg_i++;
                                parsed_args.push(parsed);
                                continue;
                            } else {
                                parsed_args.push(parsed);
                                arg_i++;
                                continue;
                            }
                        }
                    case 'number':
                        {
                            const parsed: number = parseFloat(argv[arg_i]);
                            assert(!Number.isNaN(parsed), 'Invalid number in argument: ' + argv[arg_i]);
                            parsed_args.push(parsed);
                            arg_i++;
                        }
                        continue;
                    default:
                        throw new Error('Invalid parser spesified.');
                }
            }
            throw new Error('Invalid parser spesified.');
        }

        if (arg_i < argv.length) {
            parsed_args.push(...argv.splice(arg_i, argv.length));
        }

        return parsed_args;
    }

    private async call(name: string, message: Message, argv : string[]) {
        const commands = this.commands.filter(com => (com.name === name) || (com.name?.includes(name)));

        if (commands.length === 0) throw new ReferenceError('Command not found.');

        for (const def_key in this.defaults) {
            if (this.defaults.hasOwnProperty(def_key)) {
                const def = this.defaults[def_key];
                let ret = def(message, commands);
                if (ret instanceof Promise) ret = await ret;
                if (!ret) return;
            }
        }

        for (const com_key in commands) {
            if (commands.hasOwnProperty(com_key)) {
                const command = commands[com_key];
                const args = this.parseArguments([...argv], command.parse);
                const ret = command.handler(message, args);
                if (ret instanceof Promise) {
                    if (await ret) return;
                } else if (!ret) return;
            }
        }
    }

    private async conversCall (message: Message) {
        const res = await processMessage('en', message.content);
        if ((res.intent === 'None') || (res.score < this.nlp.min_confidence)) return;

        const commands = this.converseCommands.filter(com => (com.intent === res.intent) || (com.intent?.includes(res.intent)));

        for (const def_key in this.defaults) {
            if (this.defaults.hasOwnProperty(def_key)) {
                const def = this.defaults[def_key];
                let ret = def(message, commands);
                if (ret instanceof Promise) ret = await ret;
                if (!ret) return;
            }
        }

        for (const command of commands) {
            const ret = command.handler(message, res.entities, res);
            if (ret instanceof Promise) {
                if (await ret) return;
            } else if (!ret) return;
        }
    }

    public async process (message : Message) {
        if (message.author.bot) return;
        const argv = message.content.split(this.split);
        const argc = argv.length;
        try {
            if (argv[0] === this.prefix) {
                assert(argc > 1, 'Too few arguments.');

                return await this.call(argv[1], message, argv); 
            }

            if (!this.nlp.must_include) return await this.conversCall(message);

            for (const word of this.nlp.must_include) {
                if (message.content.toUpperCase().includes(word.toUpperCase())) return await this.conversCall(message);
            }
        } catch (error) {
            message.channel.send(this.errorHandler(message, error));
        }
    }
}