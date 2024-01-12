export const enum DATABASE_MODELS {
    USER = "User",
    CHANNEL = "Channel",
    BID = "Bid",
    BID_ORDER = "BidOrder",
    ACCOUNT = "Account",
}

export const enum KEYBOARD_BUTTON_TEXT {
    MANAGEMENT = "مدیریت ☕️",
    SERVER_STATUS = "وضعیت سرور 📡",
    BOT_STATISTICS = "آمار ربات 📈",
    EXIT_ADMIN_PANEL = "خروج از پنل ❌",
}

export const enum CALLBACK_QUERY {
    JOINED_CHANNELS = "JOINED_CHANNELS",
    LIKE = "LIKE_",
    DOWNLOAD = "DOWNLOAD",
    LIST_BID_ACCOUNTS = "LIST_BID_ACCOUNTS",
    BID_ON = "BID_ON"
}

export const REGEX = {
    URL: /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()!@:%_\+.~#?&\/\/=]*)/g,
};
