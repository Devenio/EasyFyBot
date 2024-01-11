import {
    KeyboardButton,
    Message,
    ReplyKeyboardMarkup,
} from "node-telegram-bot-api";
import { IBotKeyboardButton, IKeyboardLayout } from "./Keyboard";
import TelegramBotType from "node-telegram-bot-api";
import { UserService } from "../../database/services/user.service";
import { generateRandomString } from "../../utils/random";
import { BidService } from "../../database/services/bid.service";
import dayjs from "dayjs";
import moment from "moment";
import { CALLBACK_QUERY } from "../../utils/constant";

const osu = require("node-os-utils");
const os = require("os");

export const enum KEYBOARD_BUTTON_TEXT {
    BACK_TO_HOME = "بازگشت 🔙",

    BID_ACCOUNTS_LIST = "💰 مشاهده مزایده های فعال 💰",
    SHARE_CONTACT = " ارسال شماره 📱",

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
    ON_BID_LISTS = "ON_BID_LISTS",
    ON_CREATE_ACCOUNT = "ON_CREATE_ACCOUNT",
    BACK_TO_HOME = "BACK_TO_HOME",
}

export class KeyboardConfigurationProvider {
    private readonly userService = new UserService();
    private readonly bidService = new BidService();

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
                            text: KEYBOARD_BUTTON_TEXT.BID_ACCOUNTS_LIST,
                            callbackId: KEYBOARD_BUTTON_CALLBACKS.ON_BID_LISTS,
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
                KEYBOARD_BUTTON_CALLBACKS.ON_BID_LISTS,
                this.onBidLists.bind(this),
            ],
            [
                KEYBOARD_BUTTON_CALLBACKS.ON_CREATE_ACCOUNT,
                this.onCreateAccount.bind(this),
            ],
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

    private async onBidLists(message: Message) {
        const chatId = message.chat.id;

        const user = await this.userService.findOne({
            chat_id: chatId,
        });

        if (!user?.phone) {
            return this.botInstance.sendMessage(
                chatId,
                `❗️ برای استفاده از ربات باید شماره خودتون رو ثبت کنید.\n\n⭕️ روی دکمه "ارسال شماره" کلیک کنید تا شماره شما ثبت شود 👇`,
                {
                    reply_markup: {
                        keyboard: this.getLayoutKeyboards(
                            KEYBOARD_LAYOUTS.USER_SHARE_CONTACT
                        ),
                        resize_keyboard: true,
                    },
                    parse_mode: "HTML",
                }
            );
        }

        const bids = await this.bidService.findActiveBids();

        if (!bids || !bids.length) {
            const message =
                "🔴 در حال حاضر مزایده فعالی وجود ندارد ❌\n\n🟢 برای اطلاع داشتن از مزایده های آینده چنل رو دنبال کنید:\n🆔 @BLPMaster";

            return this.botInstance.sendMessage(chatId, message);
        }

        const listBidsMessage =
            '🟢 لیست مزایده های موجود :\n(❗️ برای مشاهده اکانت های موجود در هر مزایده روی دکمه "نمایش اکانت ها" کلیک کنید)';
        await this.botInstance.sendMessage(chatId, listBidsMessage, {
            reply_markup: {
                keyboard: this.getLayoutKeyboards(
                    KEYBOARD_LAYOUTS.BACK_TO_HOME
                ),
                resize_keyboard: true
            },
        });

        bids?.forEach((bid) => {
            const startDate = moment(bid.start_date).format(
                "YYYY/MM/DD - HH:mm"
            );
            const expireDate = moment(bid.expired_date).format(
                "YYYY/MM/DD - HH:mm"
            );
            const message = `⚡️ ${bid.title}\n\n📊 تعداد اکانت های مزایده: ${bid.accounts.length}\n\n⏱ تاریخ شروع مزایده: \n${startDate}\n⏱ تاریخ پایان مزایده: \n${expireDate}`;

            this.botInstance.sendMessage(chatId, message, {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: "نمایش اکانت ها",
                                callback_data:
                                    CALLBACK_QUERY.LIST_BID_ACCOUNTS + bid._id,
                            },
                        ],
                    ],
                },
                parse_mode: "HTML",
            });
        });
    }

    private async onCreateAccount(message: Message) {
        return;
    }

    private async backToHome(message: Message) {
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
}
