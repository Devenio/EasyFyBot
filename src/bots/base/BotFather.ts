// TODO: add services to an index for importing
import TelegramBotType, {
    CallbackQuery,
    Message,
    ReplyKeyboardMarkup,
} from "node-telegram-bot-api";
import { UserService } from "../../database/services/user.service";
import { BotService } from "../../database/services/bot.service";
import {
    KEYBOARD_BUTTON_TEXT,
    CALLBACK_QUERY,
    REGEX,
} from "../../utils/constant";
import { Keyboard } from "./Keyboard";
import { ChannelService } from "../../database/services/channel.service";
import { Types } from "mongoose";
import { ObjectId } from "mongodb";

const TelegramBot = require("node-telegram-bot-api");
const cloneDeep = require("lodash.clonedeep");

export default abstract class BotFather {
    private readonly userService = new UserService();
    private readonly botService = new BotService();
    private readonly channelService = new ChannelService();

    private readonly token: string = "";
    private botObjectId: Types.ObjectId = new ObjectId();
    private botKeyboards: Keyboard | null = null;

    private lockChannels: ILockChannels[] = [];
    public readonly bot: TelegramBotType;

    constructor(params: { token: string; name: string }) {
        this.token = params.token;
        this.bot = new TelegramBot(params.token, {
            polling: true,
        });

        this.addBotToDatabase(params.name, params.token).then(() => {
            this.setLockChannels(params.token);
            this.setKeyboard();
        });

        this.bot.on("text", (message) => this.onText(message));
        this.bot.on("callback_query", (callbackQuery) =>
            this.onCallbackQuery(callbackQuery)
        );
    }

    // Initial setups
    private async addBotToDatabase(name: string, token: string) {
        const response = await this.botService.findOne({ token });

        if (!response) {
            const bot = await this.botService.create({
                name,
                token,
            });

            this.botObjectId = bot?._id as Types.ObjectId;
        } else {
            this.botObjectId = response._id;
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

    private async setKeyboard() {
        this.botKeyboards = new Keyboard({
            bot: this.bot,
        });

        await this.botKeyboards.setAdmins(this.botObjectId);
        this.botKeyboards.setupKeyboard();
    }

    // Events
    private async onText(message: Message) {
        const { id: chatId, username, first_name } = message.chat;

        if (message.text === "/start") {
            this.botKeyboards?.setAdmins(this.botObjectId);
            const replyMarkups = await this.getStartReplyMarkups(message);
            this.onStart(message, replyMarkups);
        }

        if (REGEX.URL.test(message.text || "")) {
            this.onLink(message);
        }

        await this.userService.addOrReplace(
            chatId,
            username || "",
            first_name || "",
            this.botObjectId as Types.ObjectId
        );

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
                const notJoinedChannels = await this.checkLockedChannels(
                    chatId
                );

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

    // Utils functions
    private async checkLockedChannels(chatId: number) {
        if (!this.lockChannels.length) return [];

        const channels = cloneDeep(this.lockChannels) as ILockChannels[];

        for (const channel of channels) {
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
        }

        return channels.filter((channel) => !channel.isJoined);
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

        const replyMarkup: ReplyKeyboardMarkup = {
            resize_keyboard: true,
            keyboard: [],
        };

        if (isAdmin) {
            replyMarkup.keyboard.push([
                { text: KEYBOARD_BUTTON_TEXT.MANAGEMENT },
            ]);
        }

        return replyMarkup;
    }

    // Abstract functions
    abstract onStart(
        message: Message,
        startReplyMarkups: ReplyKeyboardMarkup
    ): void;
    abstract onLink(message: Message): void;
}

interface ILockChannels {
    id: string;
    name: string;
    url: string;
    isJoined: boolean;
}
