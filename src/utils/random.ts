export function generateRandomString(): string {
    const characters =
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let randomString = "";

    while (randomString.length < 10) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        const randomChar = characters.charAt(randomIndex);

        if (!randomString.includes(randomChar)) {
            randomString += randomChar;
        }
    }

    return randomString;
}
