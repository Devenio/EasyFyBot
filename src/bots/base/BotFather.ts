import TelegramBotType, {
    CallbackQuery,
    Message,
    ReplyKeyboardMarkup,
} from "node-telegram-bot-api";
import { UserService } from "../../database/services/user.service";
import { BotService } from "../../database/services/bot.service";
import { ADMIN_KEYBOARDS } from "../../utils/constant";
import { Keyboard } from "./Keyboard";

const TelegramBot = require("node-telegram-bot-api");

export default abstract class BotFather {
    private readonly userService = new UserService();
    private readonly botService = new BotService();
    private readonly botKeyboards;

    private readonly token: string = "";

    private lockChannels: ILockChannels[] = [];
    public readonly bot: TelegramBotType;

    constructor(params: {
        token: string;
        name: string;
    }) {
        this.token = params.token;
        this.bot = new TelegramBot(params.token, {
            polling: true,
        });
        this.botKeyboards = new Keyboard({
            bot: this.bot
        })

        this.addBotToDatabase(params.name, params.token);

        this.bot.on("text", (message) => this.onText(message));
        this.bot.on("callback_query", (callbackQuery) =>
            this.onCallbackQuery(callbackQuery)
        );
    }

    private async addBotToDatabase(name: string, token: string) {
        const response = await this.botService.findOne({ token });

        if (!response) {
            this.botService.create({
                name,
                token,
            });
        }
    }

    private async onText(message: Message) {
        const { id: chatId, username, first_name } = message.chat;

        switch (message.text) {
            case "/start": {
                await this.userService.addOrReplace(
                    chatId,
                    username || "",
                    first_name || "",
                    this.token
                );

                const replyMarkups = await this.getStartReplyMarkups(message);
                this.sendWelcomeMessage(message, replyMarkups);
                this.onStart(message);
                break;
            }

            default:
                break;
        }

        const isAllJoined = await this.checkLockChannels(chatId);
        if (!isAllJoined) {
            await this.sendLockChannels(chatId);
        } else {
        }
    }

    private async onCallbackQuery(callbackQuery: CallbackQuery) {}

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
                console.error("Error in checking lock channels: ", error);
            }
        });

        return isAllJoined;
    }

    private async sendLockChannels(userId: number) {
        const channelsToJoin = this.lockChannels
            .filter((channel) => !channel.isJoined)
            .map((channel) => `${channel.name}: ${channel.url}`);

        if (channelsToJoin.length > 0) {
            const joinMessage = `To use this bot, please join the following channels 🫠:`;

            this.bot.sendMessage(userId, joinMessage, {
                reply_markup: {
                    inline_keyboard: [
                        ...this.lockChannels.map((channel) => {
                            return [{ text: channel.name, url: channel.url }];
                        }),
                        [
                            {
                                text: "I have joined ✅",
                                callback_data: `join`,
                            },
                        ],
                    ],
                },
            });
        }
    }

    private async getStartReplyMarkups(message: Message) {
        const isAdmin = await this.userService.isAdmin(
            message.chat.id,
            this.token
        );

        this.botKeyboards.setupKeyboard(!!isAdmin); 

        const replyMarkup: ReplyKeyboardMarkup = {
            resize_keyboard: true,
            keyboard: [],
        };

        if (isAdmin) {
            replyMarkup.keyboard.push([{ text: ADMIN_KEYBOARDS.MANAGEMENT }]);
        }

        return replyMarkup;
    }

    abstract onStart(message: Message): void;
    abstract sendWelcomeMessage(
        message: Message,
        replayMarkups: ReplyKeyboardMarkup
    ): void;
}

interface ILockChannels {
    id: string;
    name: string;
    url: string;
    isJoined: boolean;
}
