// TODO: add services to an index for importing
import { config } from "dotenv";
import TelegramBotType, {
    CallbackQuery,
    Message
} from "node-telegram-bot-api";
import { Keyboard } from "./Keyboard";
import { KEYBOARD_LAYOUTS, KeyboardConfigurationProvider } from "./KeyboardConfigurationProvider";

const TelegramBot = require("node-telegram-bot-api");

config();

export default abstract class BotFather {
    private readonly keyboardConfig;
    private readonly token: string = "";
    private botKeyboards: Keyboard | null = null;

    public readonly bot: TelegramBotType;

    constructor(params: { token: string; name: string }) {
        this.token = params.token;
        this.bot = new TelegramBot(params.token, {
            polling: true,
        });

        this.keyboardConfig = new KeyboardConfigurationProvider(this.bot);
        this.botKeyboards = new Keyboard(
            this.bot,
            this.keyboardConfig.getLayouts(),
            this.keyboardConfig.getCallbacks()
        );
        this.botKeyboards.initialize();

        this.bot.on("message", (message) => this.onMessage(message));
        this.bot.on("video", (message) => this.onVideo(message));
        this.bot.on("photo", (message) => this.onPhoto(message));
        this.bot.on("text", (message) => this.onText(message));
        this.bot.on("contact", (message) => this.onContact(message));
        this.bot.on("callback_query", (callbackQuery) =>
            this.onCallbackQuery(callbackQuery)
        );
    }

    // Events
    private async onMessage(message: Message) {
        if (message.text === "/start") return;

        return;
    }

    async sendMessage(chatId: number, message: Message) {
        const { bot } = this;

        if (!!message.text) {
            bot.sendMessage(chatId, message.text);
        } else if (!!message.photo) {
            bot.sendPhoto(
                chatId,
                message.photo[message.photo.length - 1].file_id,
                { caption: message.caption || "" }
            );
        } else if (!!message.video) {
            bot.sendVideo(chatId, message.video.file_id, {
                caption: message.caption || "",
            });
        } else if (!!message.document) {
            bot.sendDocument(chatId, message.document.file_id, {
                caption: message.caption || "",
            });
        } else if (!!message.voice) {
            bot.sendVoice(chatId, message.voice.file_id, {
                caption: message.caption || "",
            });
        } else if (!!message.audio) {
            bot.sendVoice(chatId, message.audio.file_id, {
                caption: message.caption || "",
            });
        } else if (!!message.sticker) {
            bot.sendSticker(chatId, message.sticker.file_id);
        } else {
            bot.sendMessage(chatId, `${message}`);
        }
    }

    private async onPhoto(message: Message) {
        return;
    }

    private async onVideo(message: Message) {
        return;
    }

    private async onContact(message: Message) {
        return;
    }

    private async onText(message: Message) {
        if (message.text === "/start") this.onStart(message);
    }

    async onStart(message: Message) {
        this.bot.sendMessage(
            message.chat.id,
            'به فروشگاه "ایزی‌فای" خوش اومدید ❤️',
            {
                reply_markup: {
                    keyboard: this.keyboardConfig.getLayoutKeyboards(KEYBOARD_LAYOUTS.USER_MAIN),
                    resize_keyboard: true
                }
            }
        );
    }

    private async onCallbackQuery(callbackQuery: CallbackQuery) {
        return;
    }
}

interface ILockChannels {
    id: string;
    name: string;
    url: string;
    isJoined: boolean;
}
