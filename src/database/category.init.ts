export const enum CATEGORIES {
    EXCHANGE = "EXCHANGE",
    FREELANCERS = "FREELANCERS",
    BROKERS = "BROKERS",
    CURRENCY_ACCOUNTS = "CURRENCY_ACCOUNTS",
    MQL = "MQL",
    GAMERS = "GAMERS",
    PROPFIRMS = "PROPFIRMS",
}

export const initCategories = [
    {
        title: "صرافی ارز دیجیتال",
        type: CATEGORIES.EXCHANGE,
    },
    {
        title: "فریلنسر ها و برنامه نویسان",
        type: CATEGORIES.FREELANCERS,
    },
    {
        title: "بروکر ها",
        type: CATEGORIES.BROKERS,
    },
    {
        title: "حساب های ارزی",
        type: CATEGORIES.CURRENCY_ACCOUNTS,
    },
    {
        title: "MQL4 و MQL5",
        type: CATEGORIES.MQL,
    },
    {
        title: "گیمر ها",
        type: CATEGORIES.GAMERS,
    },
    {
        title: "پراپ فرم ها",
        type: CATEGORIES.PROPFIRMS,
    },
];
