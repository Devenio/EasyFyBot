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
}
