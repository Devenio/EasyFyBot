import { config } from "dotenv";
import { Message, ReplyKeyboardMarkup } from "node-telegram-bot-api";
import BotFather from "./base/BotFather";

config();

export class MainBot extends BotFather {
    constructor(data: { token: string }) {
        super({
            token: data.token,
            name: "MainBot",
        });
    }

    onStart(message: Message, replyMarkup: ReplyKeyboardMarkup): void {
        this.bot.sendMessage(
            message.chat.id,
            `Hi ${message.chat.first_name} welcome to bot`,
            {
                reply_markup: {
                    ...replyMarkup,
                },
            }
        );
    }

    onLink(message: Message): void {
        return;
    }
}
