import TelegramBotType from "node-telegram-bot-api";
import { UserService } from "../database/services/user.service";

const TelegramBot = require("node-telegram-bot-api");

export default class BotFather {
    private readonly userService = new UserService();
    private bot: TelegramBotType;

    constructor(params: { token: string }) {
        this.bot = new TelegramBot(params.token, {
            polling: true
        });

        this.listenToMessages();
    }

    private listenToMessages() {
        this.bot.on("message", async (message) => {
            const { id, username, first_name } = message.chat;

            await this.userService.addOrReplace(id, username || "", first_name || "");
        })
    }
}