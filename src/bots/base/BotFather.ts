import TelegramBotType, {
    CallbackQuery,
    Message,
    ReplyKeyboardMarkup,
} from "node-telegram-bot-api";
import { UserService } from "../../database/services/user.service";
import { BotService } from "../../database/services/bot.service";
import { ADMIN_KEYBOARDS, CALLBACK_QUERY } from "../../utils/constant";
import { Keyboard } from "./Keyboard";
import { ChannelService } from "../../database/services/channel.service";
import { ChannelSchemaType } from "../../database/schemas/Channel";

const TelegramBot = require("node-telegram-bot-api");

export default abstract class BotFather {
    private readonly userService = new UserService();
    private readonly botService = new BotService();
    private readonly channelService = new ChannelService();
    private readonly botKeyboards;

    private readonly token: string = "";

    private lockChannels: ILockChannels[] = [];
    public readonly bot: TelegramBotType;

    constructor(params: { token: string; name: string }) {
        this.token = params.token;
        this.bot = new TelegramBot(params.token, {
            polling: true,
        });
        this.botKeyboards = new Keyboard({
            bot: this.bot,
        });

        this.addBotToDatabase(params.name, params.token);
        this.setLockChannels(params.token);

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

    private async setLockChannels(token: string) {
        const bot = await this.botService.findOne({ token });
        const channels = await this.channelService.find({
            bot_to_lock_ids: { $in: [bot?._id] },
        });

        if (!channels) this.lockChannels = [];

        this.lockChannels = channels?.map(({ channel_id, name, url }) => ({
            id: channel_id,
            name,
            url,
            isJoined: false,
        })) as ILockChannels[];
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

        const notJoinedChannels = await this.checkLockedChannels(chatId);
        if (notJoinedChannels.length) {
            await this.sendLockChannels(chatId, notJoinedChannels);
        }
    }

    private async onCallbackQuery(callbackQuery: CallbackQuery) {
        if (!callbackQuery.message) return;
        const chatId = callbackQuery.message?.chat.id;

        switch (callbackQuery.data) {
            case CALLBACK_QUERY.JOINED_CHANNELS:
                const notJoinedChannels = await this.checkLockedChannels(chatId);

                if (!notJoinedChannels.length) {
                    this.bot.deleteMessage(
                        chatId,
                        callbackQuery.message.message_id
                    );
                    this.bot.answerCallbackQuery(callbackQuery.id, {
                        text: "ممنون بابت عضو شدن!",
                    });

                    this.bot.sendMessage(
                        chatId,
                        "حالا لینک پستی که میخوای دانلود کنی رو بفرست 📌"
                    );
                } else {
                    this.bot.answerCallbackQuery(callbackQuery.id, {
                        text: "هنوز که عضو نشدی🫠",
                    });
                }
                break;

            default:
                break;
        }
    }

    private async checkLockedChannels(chatId: number) {
        if (!this.lockChannels.length) return [];

        const channels = [...this.lockChannels];
        channels.forEach(async (channel) => {
            try {
                const chatMember = await this.bot.getChatMember(
                    channel.id,
                    chatId
                );

                if (
                    chatMember.status === "creator" ||
                    chatMember.status === "member" ||
                    chatMember.status === "administrator"
                ) {
                    channel.isJoined = true;
                } else {
                    channel.isJoined = false;
                }
            } catch (error) {
                console.error("Error in checking lock channels: ", error);
            }
        });

        return channels.filter(
            (channel) => !channel.isJoined
        );
    }

    private async sendLockChannels(
        userId: number,
        notJoinedChannels: ILockChannels[]
    ) {
        const joinMessage = `To use this bot, please join the following channels 🫠:`;

        this.bot.sendMessage(userId, joinMessage, {
            reply_markup: {
                inline_keyboard: [
                    ...notJoinedChannels.map((channel) => {
                        return [{ text: channel.name, url: channel.url }];
                    }),
                    [
                        {
                            text: "I have joined ✅",
                            callback_data: CALLBACK_QUERY.JOINED_CHANNELS,
                        },
                    ],
                ],
            },
        });
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
