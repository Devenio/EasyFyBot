import { config } from "dotenv";
import BotFather from "../BotFather";
import { Message } from "node-telegram-bot-api";

config();

export class PikaSpotify extends BotFather {
    constructor(data: {
        token: string
    }) {
        super({
            token: data.token,
            name: "PikaSpotify",
        });
    }

    sendWelcomeMessage(message: Message): void {
        this.bot.sendMessage(
            message.chat.id,
            `Hi ${message.chat.first_name} To download from Spotify, send the track link, album or playlist 🟢.`
        );
    }

    onStart(message: Message): void {
        return;
    }
}