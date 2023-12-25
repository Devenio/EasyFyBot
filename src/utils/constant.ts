export const enum DATABASE_MODELS {
    USER = "User",
    CHANNEL = "Channel",
    FILE = "File",
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
}

export const REGEX = {
    URL: /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()!@:%_\+.~#?&\/\/=]*)/g,
};
