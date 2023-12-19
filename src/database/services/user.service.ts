import mongoose from "mongoose";
import { DATABASE_MODELS } from "../../utils/constant";

export class UserService {
    private userRepository;

    constructor() {
        this.userRepository = mongoose.model(DATABASE_MODELS.USER);
    }

    async findOneById(chatId: number) {
        const user = await this.userRepository.findOne({ chat_id: chatId });

        return user;
    }

    async create(chatId: number, username: string, firstName: string) {
        const user = new this.userRepository({
            chat_id: chatId,
            user_name: username,
            first_name: firstName,
            ban: false,
        });

        try {
            const response = await user.save();
            return response;
        } catch (err) {
            console.log("Error in Create User: ", err);
        }
    }

    async addOrReplace(chatId: number, username: string, firstName: string) {
        const user = await this.findOneById(chatId);

        if(!user) {
            await this.create(chatId, username, firstName);
        } else {
            await user.set({
                user_name: username,
                first_name: firstName,
            });
            await user.save();
        }

        return user;
    }
}
