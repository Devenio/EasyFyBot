import mongoose, { FilterQuery, Model, Schema } from "mongoose";
import { DATABASE_MODELS } from "../../utils/constant";

export abstract class BaseService<SCHEMA_TYPE> {
    private readonly schema: Schema;
    public readonly collection: Model<SCHEMA_TYPE>;

    constructor(data: { modelName: DATABASE_MODELS, schema: Schema }) {
        this.schema = data.schema
        this.collection = mongoose.models[data.modelName];
    }

    async findOne(options: FilterQuery<SCHEMA_TYPE>) {
        try {
            const response = await this.collection.findOne(options);
            return response;
        } catch (error) {
            console.log("Unable to find: ", error);
        }
    }

    async create(options: SCHEMA_TYPE) {
        try {
            const newDocument = new this.collection({
                options,
            });

            const response = await newDocument.save();
            return response;
        } catch (err) {
            console.log("Error in Create: ", err);
        }
    }
}
