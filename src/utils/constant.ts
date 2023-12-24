export const enum DATABASE_MODELS {
    USER = "User",
    CHANNEL = "Channel",
    BOT = "Bot",
}

export const enum KEYBOARD_BUTTON_TEXT {
    MANAGEMENT = "مدیریت ☕️",
    SERVER_STATUS = "وضعیت سرور 📡",
    BOT_STATISTICS = "آمار ربات 📈",
    EXIT_ADMIN_PANEL = "خروج از پنل ❌",
}

export const enum CALLBACK_QUERY {
    JOINED_CHANNELS = "JOINED_CHANNELS",
}

export const REGEX = {
    URL: /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()!@:%_\+.~#?&\/\/=]*)/g,

    SPOTIFY_TRACK:
        /(https?:\/\/)?(www\.)?(open\.spotify\.com|spotify\.?com)\/track\/.+/,
    SPOTIFY_ALBUM:
        /(https?:\/\/)?(www\.)?(open\.spotify\.com|spotify\.?com)\/album\/.+/,
    SPOTIFY_PLAYLIST:
        /(https?:\/\/)?(www\.)?(open\.spotify\.com|spotify\.?com)\/playlist\/.+/,
};
