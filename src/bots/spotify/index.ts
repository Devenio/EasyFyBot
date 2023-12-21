import { config } from "dotenv";
import BotFather from "../base/BotFather";
import { Message, ReplyKeyboardMarkup } from "node-telegram-bot-api";

config();

export class PikaSpotify extends BotFather {
    constructor(data: { token: string }) {
        super({
            token: data.token,
            name: "PikaSpotify",
        });
    }

    sendWelcomeMessage(
        message: Message,
        replyMarkup: ReplyKeyboardMarkup
    ): void {
        this.bot.sendMessage(
            message.chat.id,
            `Hi ${message.chat.first_name} To download from Spotify, send the track link, album or playlist 🟢.`,
            {
                reply_markup: {
                    ...replyMarkup
                }
            }
        );
    }

    onStart(message: Message): void {
        return;
    }
}
