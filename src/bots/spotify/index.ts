import { config } from "dotenv";
import BotFather from "../BotFather";
import { Message } from "node-telegram-bot-api";

config();

export class PikaSpotify extends BotFather {
    constructor() {
        super({
            token: process.env.BOT_TOKEN_SPOTIFY || "",
            name: "PikaSpotify"
        })
    }

    sendWelcomeMessage(message: Message): void {
        this.bot.sendMessage(
            message.chat.id,
            `Hi ${message.chat.first_name}, Welcome to bot.`
        );    
    }

    onStart(message: Message): void {

    }
}