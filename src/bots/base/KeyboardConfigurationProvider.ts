import { KeyboardButton, Message } from "node-telegram-bot-api";
import { IBotKeyboardButton, IKeyboardLayout } from "./Keyboard";
import TelegramBotType from "node-telegram-bot-api";
import { UserService } from "../../database/services/user.service";

const osu = require("node-os-utils");
const os = require("os");

export const enum KEYBOARD_BUTTON_TEXT {
    BID_ACCOUNTS_LIST = "💰 مشاهده اکانت های مزایده 💰",

    MANAGEMENT = "مدیریت ☕️",
    SERVER_STATUS = "وضعیت سرور 📡",
    BOT_STATISTICS = "آمار ربات 📈",
    EXIT_ADMIN_PANEL = "خروج از پنل ❌",
}

export enum KEYBOARD_LAYOUTS {
    USER_MAIN = "USER_MAIN",

    ADMIN_MAIN = "ADMIN_MAIN",
    ADMIN_MANAGEMENT = "ADMIN_MANAGEMENT",
}

enum KEYBOARD_BUTTON_CALLBACKS {
    ON_SERVER_STATUS = "ON_SERVER_STATUS",
    ON_BOT_STATISTICS = "ON_BOT_STATISTICS",
}

export class KeyboardConfigurationProvider {
    private readonly userService = new UserService();

    private layouts: IKeyboardLayout;
    private callbacks: Map<string, Function>;

    constructor(private botInstance: TelegramBotType) {
        this.layouts = {
            [KEYBOARD_LAYOUTS.USER_MAIN]: () => {
                return [
                    [
                        {
                            text: KEYBOARD_BUTTON_TEXT.BID_ACCOUNTS_LIST,
                            callbackMessage: "adasdsads",
                            subLayoutId: KEYBOARD_LAYOUTS.ADMIN_MANAGEMENT,
                        },
                    ],
                ];
            },
            [KEYBOARD_LAYOUTS.ADMIN_MAIN]: () => {
                return [
                    ...this.layouts[KEYBOARD_LAYOUTS.USER_MAIN](),
                    [
                        {
                            text: KEYBOARD_BUTTON_TEXT.MANAGEMENT,
                            callbackMessage: "به پنل ادمین خوش اومدی.",
                            isAdminButton: true,
                            subLayoutId: KEYBOARD_LAYOUTS.ADMIN_MANAGEMENT,
                        },
                    ],
                ];
            },
            [KEYBOARD_LAYOUTS.ADMIN_MANAGEMENT]: () => {
                return [
                    [
                        {
                            text: KEYBOARD_BUTTON_TEXT.SERVER_STATUS,
                            callbackId:
                                KEYBOARD_BUTTON_CALLBACKS.ON_SERVER_STATUS,
                            isAdminButton: true,
                        },
                    ],
                    [
                        {
                            text: KEYBOARD_BUTTON_TEXT.BOT_STATISTICS,
                            callbackId:
                                KEYBOARD_BUTTON_CALLBACKS.ON_BOT_STATISTICS,
                            isAdminButton: true,
                        },
                    ],
                    [
                        {
                            text: KEYBOARD_BUTTON_TEXT.EXIT_ADMIN_PANEL,
                            callbackMessage: "از پنل ادمین خارج شدید.",
                            isAdminButton: true,
                            subLayoutId: KEYBOARD_LAYOUTS.ADMIN_MAIN,
                        },
                    ],
                ];
            },
        };

        this.callbacks = new Map<
            KEYBOARD_BUTTON_CALLBACKS,
            (message: Message) => void
        >([
            [
                KEYBOARD_BUTTON_CALLBACKS.ON_SERVER_STATUS,
                this.onServerStatus.bind(this),
            ],
            [
                KEYBOARD_BUTTON_CALLBACKS.ON_BOT_STATISTICS,
                this.onBotStatistics.bind(this),
            ],
        ]);
    }

    getLayout(layoutId: string): IBotKeyboardButton[][] {
        return this.layouts[layoutId]();
    }

    getLayoutKeyboards(layoutId: string): KeyboardButton[][] {
        return this.layouts[layoutId]().map((layout) =>
            layout.map((keyboard) => ({ text: keyboard.text }))
        );
    }

    getCallback(callbackId: string): Function | undefined {
        return this.callbacks.get(callbackId);
    }

    getLayouts() {
        return this.layouts;
    }

    getCallbacks() {
        return this.callbacks;
    }

    registerLayout(layoutId: string, layout: IBotKeyboardButton[][]): void {
        this.layouts[layoutId] = () => layout;
    }

    registerCallback(callbackId: string, callback: Function): void {
        this.callbacks.set(callbackId, callback);
    }

    // Callbacks
    private async onServerStatus(message: Message) {
        const cpu = osu.cpu;

        const info = await cpu.usage();

        this.botInstance.sendMessage(
            message.chat.id,
            ` 🗂 RAM : ${(
                os.totalmem() / 1024 / 1024 / 1024 -
                os.freemem() / 1024 / 1024 / 1024
            ).toFixed(2)}/${(os.totalmem() / 1024 / 1024 / 1024).toFixed(
                2
            )} GB\n🖥 Type : ${os.type}\n⚙️ CPU USAGE : ${info}%
                `
        );
    }

    private async onBotStatistics(message: Message) {
        const countAll = await this.userService.count();
        const countBannedUsers = await this.userService.count({
            is_ban: true,
        });

        this.botInstance.sendMessage(
            message.chat.id,
            `👤 تعداد کاربران : ${countAll} \n 🔞 تعداد کاربران بن شده : ${countBannedUsers}`
        );
    }
}
