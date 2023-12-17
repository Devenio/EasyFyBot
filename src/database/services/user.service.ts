import mongoose from "mongoose";
import { DATABASE_MODELS } from "../../utils/constant";

export class UserService {
    private userRepository;

    constructor() {
        this.userRepository = mongoose.models[DATABASE_MODELS.USER];
    }

    async findOneById(chatId: number) {
        const user = await this.userRepository.find({ chat_id: chatId });
        return user;
    }
}
