import { config } from "dotenv";
import BotFather from "./base/BotFather";

config();

export class MainBot extends BotFather {
    constructor(data: { token: string }) {
        super({
            token: data.token,
            name: "MainBot",
        });
    }
}
