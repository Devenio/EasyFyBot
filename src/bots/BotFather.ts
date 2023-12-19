import TelegramBotType, { Message } from "node-telegram-bot-api";
import { UserService } from "../database/services/user.service";
import { BotService } from "../database/services/bot.service";

const TelegramBot = require("node-telegram-bot-api");

export default abstract class BotFather {
    private readonly userService = new UserService();
    private readonly botService = new BotService();
    private lockChannels: ILockChannels[] = [];
    public readonly bot: TelegramBotType;

    constructor(params: { token: string; name: string }) {
        this.bot = new TelegramBot(params.token, {
            polling: true,
        });

        this.addBotToDatabase(params.name, params.token);
        this.listenToMessages();
    }

    private addBotToDatabase(name: string, token: string) {
        const response = this.botService.findOne({ token });

        if (!response) {
            this.botService.create({
                name,
                token,
            });
        }
    }

    private listenToMessages() {
        this.bot.on("message", async (message) => {
            const { id: userId, username, first_name } = message.chat;

            await this.userService.addOrReplace(
                userId,
                username || "",
                first_name || ""
            );

            switch (message.text) {
                case "/start":
                    this.sendWelcomeMessage(message);
                    this.onStart(message);
                    break;

                default:
                    break;
            }

            const isAllJoined = await this.checkLockChannels(userId);

            if (!isAllJoined) {
                await this.sendLockChannels();
            } else {
            }
        });
    }

    private async checkLockChannels(userId: number) {
        if (!this.lockChannels.length) return true;

        let isAllJoined = true;
        this.lockChannels.forEach(async (channel) => {
            try {
                const chatMember = await this.bot.getChatMember(
                    channel.id,
                    userId
                );

                if (
                    chatMember.status === "creator" ||
                    chatMember.status === "member" ||
                    chatMember.status === "administrator"
                ) {
                    channel.isJoined = true;
                } else {
                    channel.isJoined = false;
                    isAllJoined = false;
                }
            } catch (error) {
                console.log("Error in checking lock channels: ", error);
            }
        });

        return isAllJoined;
    }

    private async sendLockChannels() {}

    public sendWelcomeMessage(message: Message) {
        this.bot.sendMessage(
            message.chat.id,
            `Hi ${message.chat.first_name}, Welcome to bot.`
        );
    }

    abstract onStart(message: Message): void;
}

interface ILockChannels {
    id: string;
    name: string;
    url: string;
    isJoined: boolean;
}
