// TODO: add services to an index for importing
import { config } from "dotenv";
import TelegramBotType, { CallbackQuery, Message } from "node-telegram-bot-api";
import { Keyboard } from "./Keyboard";
import {
    KEYBOARD_LAYOUTS,
    KeyboardConfigurationProvider,
} from "./KeyboardConfigurationProvider";
import { ProductService } from "../../database/services/product.service";
import { UserService } from "../../database/services/user.service";
import { OrderService } from "../../database/services/order.service";

const TelegramBot = require("node-telegram-bot-api");

config();

export default abstract class BotFather {
    productMessageId = 0;
    orderMessageId = 0;

    private readonly productService = new ProductService();
    private readonly userService = new UserService();
    private readonly orderService = new OrderService();

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
        if (message.text?.startsWith("/start")) this.onStart(message);
    }

    async onStart(message: Message) {
        const referral = message.text?.split(' ')[1]

        this.userService.addOrReplace(
            message.chat.id,
            message.chat.username || "",
            message.chat.first_name || "",
            referral || ''
        );

        if(referral) {
            this.bot.sendMessage(+referral, '✅ یک کاربر از طرف شما به بات اضافه شد')
        }

        this.bot.sendMessage(
            message.chat.id,
            'به فروشگاه "ایزی‌فای" خوش اومدید ❤️',
            {
                reply_markup: {
                    keyboard: this.keyboardConfig.getLayoutKeyboards(
                        KEYBOARD_LAYOUTS.USER_MAIN
                    ),
                    resize_keyboard: true,
                },
            }
        );
    }

    private async onCallbackQuery(callbackQuery: CallbackQuery) {
        const chatId = callbackQuery.message?.chat.id || 0;
        this.bot.answerCallbackQuery('در حال پردازش...')

        if (callbackQuery.data?.startsWith("PAYMENT_")) {
            const productId = callbackQuery.data.split("PAYMENT_")[1];

            const payment = await this.orderService.create({
                productId: productId,
                userChatId: chatId,
            });

            this.bot.sendMessage(
                chatId,
                `
◀️ شماره سفارش: ${payment?._id}

💢 در صورت پرداخت فرم زیر رو پر کنید و ایمیل خودتون رو برای پشتیبان به آیدی @EasyFySupport ارسال کنید. در کمتر از 1 ساعت اطلاعات شما بررسی میشه و در 7 الی 10 آینده پکیج شما به دستتون میرسه:

➡️ https://forms.gle/qzcBLfse3Enu4DL76
            `
            );
        }

        if (callbackQuery.data?.startsWith("EXIT")) {
            try {
                console.log(this.productMessageId, this.orderMessageId);
                if (this.productMessageId) {
                    await this.bot.deleteMessage(
                        callbackQuery.message?.chat.id || 0,
                        this.productMessageId
                    );

                    this.productMessageId = 0;
                }

                if (this.orderMessageId) {
                    await this.bot.deleteMessage(chatId, this.orderMessageId);

                    this.orderMessageId = 0;
                }

                this.keyboardConfig.onCategories(
                    callbackQuery.message as Message
                );
            } catch (error) {
                console.log("Line 143");
            }
        }

        if (callbackQuery.data?.startsWith("PRODUCT_")) {
            const productId = callbackQuery.data.split("PRODUCT_")[1];

            const product = await this.productService.findById(productId);

            if (!product) {
                this.bot.sendMessage(
                    callbackQuery.message?.chat.id || 0,
                    "مشکلی رخ داده. لطفا با پشتیبان در ارتباط باشید."
                );
                return;
            }

            try {
                await this.bot.deleteMessage(
                    callbackQuery.message?.chat.id || 0,
                    this.productMessageId
                );

                this.productMessageId = 0;
            } catch (err) {
                console.log("Line 140");
            }

            const orderMessage = await this.bot.sendPhoto(
                chatId,
                "src/assets/photo_2024-03-22_16-55-45.jpg",
                {
                    caption: `
✅ پکیج ${product.title}
⬅️ قیمت: ${product.price} تتر

⬅️ ویژگی های پکیج:
👈  2 مدرک فیزیکی
👈  تست و استعلام مدارک
👈  با چهره و مشخصات خودتان
👈 کدملی اصلی و  قابل استعلام
👈 گرافیک و طراحی مطابق با نمونه واقعی
👈 آموزش و پشتیبانی مادام العمر
👈 ضمانت بازگشت وجه در صورت عدم وریفای

💢 برای خرید این اکانت هزینه ${product.price} تتر به ولت زیر واریز کنید و پس از پرداخت آدرس ترون اسکن به همراه شماره سفارش خودتون رو به آیدی @EasyFySupport ارسال کنید. 

TULFhgreD6YRK32tyix1cX9x4HQxvN8vWo

❌ پس از ارسال اطلاعات صحت اطلاعات شما تا کمتر از 1 ساعت بررسی شده و در کمتر از 10 روز کاری پروسه وریفای شما انجام شده و مدارک فیزیکی براتون ارسال میشه.
            `,
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: "پرداخت 💰",
                                    url: "https://link.trustwallet.com/send?address=TULFhgreD6YRK32tyix1cX9x4HQxvN8vWo&asset=c195_tTR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
                                },
                            ],
                            [
                                {
                                    text: "پرداخت شد ✅",
                                    callback_data: `PAYMENT_${product._id}`,
                                },
                            ],
                            [{ text: "بازگشت ⬅️", callback_data: "EXIT" }],
                        ],
                    },
                }
            );

            this.orderMessageId = orderMessage.message_id;
        }

        if (callbackQuery.data?.startsWith("CATEGORY_")) {
            const type = callbackQuery.data.split("CATEGORY_")[1];

            const products = await this.productService.find({ category: type });

            if (!products) {
                this.bot.sendMessage(
                    callbackQuery.message?.chat.id || 0,
                    "مشکلی رخ داده. لطفا با پشتیبان در ارتباط باشید."
                );
                return;
            }

            try {
                await this.bot.deleteMessage(
                    callbackQuery.message?.chat.id || 0,
                    this.keyboardConfig.categoryMessageId
                );

                this.keyboardConfig.categoryMessageId = 0;
            } catch (err) {
                console.log("Line 140");
            }

            const res = await this.bot.sendMessage(
                callbackQuery.message?.chat.id || 0,
                "لطفا خدمات مورد نظر خودتون رو انتخاب کنید:",
                {
                    reply_markup: {
                        inline_keyboard: [
                            ...products.map((product) => [
                                {
                                    text: product.title,
                                    callback_data: `PRODUCT_${product._id}`,
                                },
                            ]),
                            [{ text: "بازگشت ⬅️", callback_data: "EXIT" }],
                        ],
                    },
                }
            );

            this.productMessageId = res.message_id;
        }
        return;
    }
}

interface ILockChannels {
    id: string;
    name: string;
    url: string;
    isJoined: boolean;
}
