import mongoose, {
    Document,
    FilterQuery,
    IfAny,
    Model,
    Require_id,
    Schema,
} from "mongoose";
import { DATABASE_MODELS } from "../../utils/constant";
import { ObjectId } from "mongoose";
import { UpdateQuery } from "mongoose";
import { QueryOptions } from "mongoose";

export abstract class BaseService<SCHEMA_TYPE> {
    private readonly schema: Schema;
    public readonly collection: Model<SCHEMA_TYPE>;

    constructor(data: { modelName: DATABASE_MODELS; schema: Schema }) {
        this.schema = data.schema;
        this.collection = mongoose.models[data.modelName];
    }

    async find(options: FilterQuery<SCHEMA_TYPE>) {
        try {
            const response = await this.collection.find(options);
            return response;
        } catch (error) {
            console.error("Unable to find: ", error);
        }
    }

    async findOne(options: FilterQuery<SCHEMA_TYPE>) {
        try {
            const response = await this.collection.findOne(options);
            return response;
        } catch (error) {
            console.error("Unable to find: ", error);
        }
    }

    async create(options: SCHEMA_TYPE): Promise<Document<SCHEMA_TYPE> | undefined> {
        try {
            const newDocument = new this.collection({
                ...options,
            });

            const response = await newDocument.save();
            return response as Document<SCHEMA_TYPE>;
        } catch (err) {
            console.error("Error in Create: ", err);
        }
    }

    async findOneAndUpdate(filter?: FilterQuery<SCHEMA_TYPE>, update?: UpdateQuery<SCHEMA_TYPE>, options?: QueryOptions<SCHEMA_TYPE>) {
        try {
            const response = await this.collection.findOneAndUpdate(filter, update, options);
            return response;
        } catch (error) {
            console.error("Unable to update: ", error);
        }
    }

    async count(options: FilterQuery<SCHEMA_TYPE> = {}) {
        try {
            const response = await this.collection.countDocuments({
                ...options,
            });

            return response;
        } catch (err) {
            console.error("Error in Count: ", err);
        }
    }
}
