import TelegramBotType, {
    InlineKeyboardButton,
    KeyboardButton,
    Message,
    ReplyKeyboardMarkup,
} from "node-telegram-bot-api";
import { UserService } from "../../database/services/user.service";
import { IBotKeyboardButton, IKeyboardLayout } from "./Keyboard";
import { CategoryService } from "../../database/services/category.service";

const osu = require("node-os-utils");
const os = require("os");

const enum CATEGORIES {
    EXCHANGE = "صرافی ارز دیجیتال",
    FREELANCERS = "فریلنسر ها و برنامه نویسان",
    BROKERS = "بروکر ها",
    CURRENCY_ACCOUNTS = "حساب های ارزی",
    MQL = "MQL4 و MQL5",
    GAMERS = "گیمر ها",
    PROPFIRMS = "پراپ فرم ها",
}

export const enum KEYBOARD_BUTTON_TEXT {
    BACK_TO_HOME = "بازگشت 🔙",

    CATEGORY = "🛒 دسته بندی محصولات",
    SHARE_CONTACT = " ارسال شماره 📱",
    SUPPORT = "👤 ارتباط با پشتیبانی",

    BID_MANAGEMENT = "مدیریت مزایده 💸",
    CREATE_ACCOUNT = "ساخت اکانت جدید",
    MANAGEMENT = "مدیریت ☕️",
    SERVER_STATUS = "وضعیت سرور 📡",
    BOT_STATISTICS = "آمار ربات 📈",
    EXIT_ADMIN_PANEL = "خروج از پنل ❌",
}

export enum KEYBOARD_LAYOUTS {
    BACK_TO_HOME = "BACK_TO_HOME",

    USER_MAIN = "USER_MAIN",
    USER_SHARE_CONTACT = "USER_SHARE_CONTACT",

    ADMIN_MAIN = "ADMIN_MAIN",
    ADMIN_MANAGEMENT = "ADMIN_MANAGEMENT",
    ADMIN_BID_MANAGEMENT = "ADMIN_BID_MANAGEMENT",
}

enum KEYBOARD_BUTTON_CALLBACKS {
    ON_SERVER_STATUS = "ON_SERVER_STATUS",
    ON_BOT_STATISTICS = "ON_BOT_STATISTICS",
    ON_CATEGORY = "ON_CATEGORY",
    ON_SUPPORT = "ON_SUPPORT",
    ON_CREATE_ACCOUNT = "ON_CREATE_ACCOUNT",
    BACK_TO_HOME = "BACK_TO_HOME",
}

export class KeyboardConfigurationProvider {
    private readonly userService = new UserService();
    private readonly categoryService = new CategoryService();

    public categoryMessageId = 0;

    private layouts: IKeyboardLayout;
    private callbacks: Map<string, Function>;

    constructor(private botInstance: TelegramBotType) {
        this.layouts = {
            [KEYBOARD_LAYOUTS.BACK_TO_HOME]: (
                backLayout: KEYBOARD_LAYOUTS = KEYBOARD_LAYOUTS.USER_MAIN
            ) => {
                return [
                    [
                        {
                            text: KEYBOARD_BUTTON_TEXT.BACK_TO_HOME,
                            callbackId: KEYBOARD_BUTTON_CALLBACKS.BACK_TO_HOME,
                        },
                    ],
                ];
            },
            [KEYBOARD_LAYOUTS.USER_MAIN]: () => {
                return [
                    [
                        {
                            text: KEYBOARD_BUTTON_TEXT.CATEGORY,
                            callbackId: KEYBOARD_BUTTON_CALLBACKS.ON_CATEGORY,
                        },
                    ],
                    [
                        {
                            text: KEYBOARD_BUTTON_TEXT.SUPPORT,
                            callbackId: KEYBOARD_BUTTON_CALLBACKS.ON_SUPPORT,
                        },
                    ],
                ];
            },
            [KEYBOARD_LAYOUTS.USER_SHARE_CONTACT]: () => {
                return [
                    [
                        {
                            text: KEYBOARD_BUTTON_TEXT.SHARE_CONTACT,
                            request_contact: true,
                        },
                    ],
                    ...this.layouts[KEYBOARD_LAYOUTS.BACK_TO_HOME](),
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
                    [
                        {
                            text: KEYBOARD_BUTTON_TEXT.BID_MANAGEMENT,
                            callbackMessage: "مدیریت مزایده ها.",
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
            [KEYBOARD_LAYOUTS.ADMIN_BID_MANAGEMENT]: () => {
                return [
                    [
                        {
                            text: KEYBOARD_BUTTON_TEXT.CREATE_ACCOUNT,
                            callbackId:
                                KEYBOARD_BUTTON_CALLBACKS.ON_SERVER_STATUS,
                            isAdminButton: true,
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
            [
                KEYBOARD_BUTTON_CALLBACKS.ON_CATEGORY,
                this.onCategories.bind(this),
            ],
            [KEYBOARD_BUTTON_CALLBACKS.ON_SUPPORT, this.onSupport.bind(this)],
            [
                KEYBOARD_BUTTON_CALLBACKS.BACK_TO_HOME,
                this.backToHome.bind(this),
            ],
        ]);
    }

    getLayout(layoutId: string): IBotKeyboardButton[][] {
        return this.layouts[layoutId]();
    }

    getLayoutKeyboards(layoutId: string): KeyboardButton[][] {
        return this.layouts[layoutId]().map((layout) =>
            layout.map((keyboard) => ({
                text: keyboard.text,
                request_contact: keyboard.request_contact,
            }))
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
    async onCategories(message: Message) {
        const res = await this.botInstance.sendMessage(
            message.chat.id,
            "در حال بارگذاری دسته بندی ها..."
        );

        const categories = await this.categoryService.find({});
        await this.botInstance.deleteMessage(message.chat.id, res.message_id);

        if (!categories) {
            this.botInstance.sendMessage(
                message.chat.id,
                "مشکلی رخ داده. لطفا با پشتیبان در ارتباط باشید."
            );
            return;
        }

        const msg = await this.botInstance.sendMessage(
            message.chat.id,
            "لطفا خدمات یا محصول مورد نظر خودتون رو انتخاب کنید:",
            {
                reply_markup: {
                    inline_keyboard: categories.map((category) => [
                        {
                            text: category.title,
                            callback_data: `CATEGORY_${category.type}`,
                        },
                    ]),
                },
            }
        );
        this.categoryMessageId = msg.message_id;
    }

    async onServerStatus(message: Message) {
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

    async onBotStatistics(message: Message) {
        const countAll = await this.userService.count();
        const countBannedUsers = await this.userService.count({
            is_ban: true,
        });

        this.botInstance.sendMessage(
            message.chat.id,
            `👤 تعداد کاربران : ${countAll} \n 🔞 تعداد کاربران بن شده : ${countBannedUsers}`
        );
    }

    async backToHome(message: Message) {
        const isAdmin = await this.userService.isAdmin(message.chat.id);

        const replyMarkup: ReplyKeyboardMarkup = {
            resize_keyboard: true,
            keyboard: this.getLayoutKeyboards(KEYBOARD_LAYOUTS.USER_MAIN),
        };

        if (isAdmin) {
            const adminKeyboardLayout = this.getLayoutKeyboards(
                KEYBOARD_LAYOUTS.ADMIN_MAIN
            );
            replyMarkup.keyboard = adminKeyboardLayout;
        }

        this.botInstance.sendMessage(
            message.chat.id,
            "به منوی اصلی بازگشتید. یک دکمه را برای ادامه کار انتخاب کنید:",
            {
                reply_markup: replyMarkup,
            }
        );
    }

    async onSupport(message: Message) {
        this.botInstance.sendMessage(
            message.chat.id,
            "❗️ برای ارتباط با پشتیبانی به آیدی زیر پیام بدید:\n🆔 @BLPMaster_Support"
        );
    }
}
