// TODO: add services to an index for importing
import TelegramBotType, {
    CallbackQuery,
    Message,
    Metadata,
    PhotoSize,
    ReplyKeyboardMarkup,
} from "node-telegram-bot-api";
import { ChannelService } from "../../database/services/channel.service";
import { UserService } from "../../database/services/user.service";
import {
    CALLBACK_QUERY,
    KEYBOARD_BUTTON_TEXT,
    REGEX,
} from "../../utils/constant";
import { Keyboard } from "./Keyboard";
import { FileService } from "../../database/services/file.service";
import { randomUUID } from "crypto";
import { generateRandomString } from "../../utils/random";
import { FILE_TYPES, FileSchemaType } from "../../database/schemas/File";
import { ObjectId } from "mongoose";

const TelegramBot = require("node-telegram-bot-api");
const cloneDeep = require("lodash.clonedeep");

export default abstract class BotFather {
    private readonly userService = new UserService();
    private readonly channelService = new ChannelService();
    private readonly fileService = new FileService();

    private readonly token: string = "";
    private botKeyboards: Keyboard | null = null;
    private adminChatIds: number[] = [];

    private lockChannels: ILockChannels[] = [];
    private mainChannelId = "-1001949613578";
    public readonly bot: TelegramBotType;

    constructor(params: { token: string; name: string }) {
        this.token = params.token;
        this.bot = new TelegramBot(params.token, {
            polling: true,
        });

        this.setLockChannels();
        this.setKeyboard();

        this.bot.on("message", (message) => this.onMessage(message));
        this.bot.on("video", (message) => this.onVideo(message));
        this.bot.on("photo", (message) => this.onPhoto(message));
        this.bot.on("text", (message, metadata) =>
            this.onText(message, metadata)
        );
        this.bot.on("callback_query", (callbackQuery) =>
            this.onCallbackQuery(callbackQuery)
        );
    }

    // Initial setups
    private async setLockChannels() {
        const channels = await this.channelService.find({});

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

        const adminChatIds = await this.getAdminChatIds();
        this.adminChatIds = adminChatIds;
        this.botKeyboards.setAdmins(adminChatIds);
        this.botKeyboards.setupKeyboard();
    }

    private async updateAdmins() {
        const adminChatIds = await this.getAdminChatIds();
        this.adminChatIds = adminChatIds;
        this.botKeyboards?.setAdmins(adminChatIds);
    }

    private async getAdminChatIds() {
        const admins = await this.userService.getAdmins();

        if (!admins) {
            return [];
        }
        return admins?.map((admin) => admin.chat_id);
    }

    // Events
    private async onMessage(message: Message) {
        // console.log("On message: ", message, "\n\n\n");
    }

    private async onPhoto(message: Message) {
        this.bot.sendMessage(message.chat.id, "🎞 ویدیو دریافت شد");
    }

    private async onVideo(message: Message) {
        this.bot.sendMessage(message.chat.id, "🎞 عکس دریافت شد");
    }

    private async onText(message: Message, metadata: Metadata) {
        const { id: chatId, username, first_name } = message.chat;

        if (message.text === "/start") {
            this.updateAdmins();
            const replyMarkups = await this.getStartReplyMarkups(message);
            this.onStart(message, replyMarkups);
        }

        if (
            message.text?.startsWith("/start") &&
            message.text?.split(" ").length == 2
        ) {
            this.onDownloadFile(message);
        }

        // sta = Send To All
        if (message.text === "/sta" && this.isAdmin(chatId)) {
            this.sendToAll(message);
        }
        // stc = Send To Channel
        if (message.text === "/stc" && this.isAdmin(chatId)) {
            this.sendToChannel(message);
        }

        if (REGEX.URL.test(message.text || "")) {
            // this.onLink(message);
        }

        await this.userService.addOrReplace(
            chatId,
            username || "",
            first_name || ""
        );

        const notJoinedChannels = await this.checkLockedChannels(chatId);
        if (notJoinedChannels.length) {
            await this.sendLockChannels(chatId, notJoinedChannels);
        }
    }

    async onDownloadFile(message: Message) {
        const file = await this.fileService.findOne({
            short_id: message.text?.split(" ")[1],
        });
        if (!file) {
            this.bot.sendMessage(message.chat.id, `فایل یافت نشد  😔`);
            return;
        }

        const caption = "🔥 Channel : @NudeLean";
        const replyMarkup = {
            inline_keyboard: this.generateFileInlineKeyboard(file),
        };

        if (file.type === FILE_TYPES.PHOTO) {
            this.bot.sendPhoto(message.chat.id, file.file_id, {
                caption,
                reply_markup: replyMarkup,
            });
        }
        if (file.type === FILE_TYPES.VIDEO) {
            this.bot.sendVideo(message.chat.id, file.file_id, {
                caption,
                reply_markup: replyMarkup,
            });
        }

        this.fileService.findOneAndUpdate(
            { short_id: file.short_id },
            { $inc: { downloads: 1 } }
        );
    }

    async onStart(message: Message, startReplyMarkups: ReplyKeyboardMarkup) {
        this.bot.sendMessage(
            message.chat.id,
            `Hi ${message.chat.first_name} welcome to bot`,
            {
                reply_markup: {
                    ...startReplyMarkups,
                },
            }
        );
    }

    private async onCallbackQuery(callbackQuery: CallbackQuery) {
        if (!callbackQuery.message) return;
        const chatId = callbackQuery.message?.chat.id;

        if (callbackQuery.data === CALLBACK_QUERY.JOINED_CHANNELS) {
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
        }

        if (callbackQuery.data?.startsWith(CALLBACK_QUERY.LIKE)) {
            const file = await this.fileService.findOneAndUpdate(
                { short_id: callbackQuery.data.split("_")[1] },
                { $inc: { likes: 1 } }
            );

            if (!file) {
                this.bot.answerCallbackQuery(callbackQuery.id, {
                    text: "خطا",
                });
                return;
            }

            this.bot.answerCallbackQuery(callbackQuery.id, {
                text: "پست لایک شد ❤️",
            });

            this.bot.editMessageReplyMarkup(
                { inline_keyboard: this.generateFileInlineKeyboard(file) },
                {
                    chat_id: callbackQuery.message.chat.id,
                    message_id: callbackQuery.message.message_id,
                }
            );
        }

        if (callbackQuery.data?.startsWith(CALLBACK_QUERY.DOWNLOAD)) {
            this.bot.answerCallbackQuery(callbackQuery.id, {
                text: "این دکمه صرفا جهت نمایش تعداد دانلود هاست :)",
            });
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

    isAdmin(chatId: number) {
        return this.adminChatIds.includes(chatId);
    }

    generateFileInlineKeyboard(file: FileSchemaType) {
        return [
            [
                {
                    text: `تعداد دانلود : ${file.downloads}`,
                    callback_data: CALLBACK_QUERY.DOWNLOAD,
                },
            ],
            [
                {
                    text: `❤️ ${file.likes}`,
                    callback_data: `${CALLBACK_QUERY.LIKE}${file.short_id}`,
                },
            ],
        ];
    }

    // Command Methods
    sendToAll(message: Message) {
        const chatId = message.chat.id;

        if (
            !message.reply_to_message ||
            (!message.reply_to_message.photo && !message.reply_to_message.video)
        ) {
            this.bot.sendMessage(
                chatId,
                "روی یک پیام حاوی عکس یا فیلم ریپلای کنید !"
            );
            return;
        }

        if (message.reply_to_message.photo) {
            const fileId = message.reply_to_message.photo[3].file_id;

            this.bot.sendPhoto(chatId, fileId);
        }

        if (message.reply_to_message.video) {
            console.log(message.reply_to_message.video);
        }
    }

    async sendToChannel(message: Message) {
        const chatId = message.chat.id;

        if (
            !message.reply_to_message ||
            (!message.reply_to_message.photo && !message.reply_to_message.video)
        ) {
            this.bot.sendMessage(
                chatId,
                "روی یک پیام حاوی عکس یا فیلم ریپلای کنید !"
            );
            return;
        }

        const fileShortId = generateRandomString();

        if (message.reply_to_message.photo) {
            const fileId = message.reply_to_message.photo[3].file_id;

            await this.fileService.create({
                file_id: fileId,
                short_id: fileShortId,
                type: FILE_TYPES.PHOTO,
            });

            this.bot.sendMessage(
                this.mainChannelId,
                `
                    🔆 Photo

                    <a href="https://t.me/NudeLean_Bot?start=${fileShortId}">📥 مشاهده نود از ربات </a>
                `,
                {
                    parse_mode: "HTML",
                }
            );
        }

        if (message.reply_to_message.video) {
            const fileId = message.reply_to_message.video.file_id;

            await this.fileService.create({
                file_id: fileId,
                short_id: fileShortId,
                type: FILE_TYPES.VIDEO,
            });

            this.bot.sendMessage(
                this.mainChannelId,
                `
                    🔆 Video

                    <a href="https://t.me/NudeLean_Bot?start=${fileShortId}">📥 مشاهده نود از ربات </a>
                `,
                {
                    parse_mode: "HTML",
                }
            );
        }
    }
}

interface ILockChannels {
    id: string;
    name: string;
    url: string;
    isJoined: boolean;
}
