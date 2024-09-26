import mongoose from "mongoose";
import dotenv from "dotenv"

dotenv.config()

const connectDB = async() => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${process.env.DB_NAME}`)

        console.log(`\n MongoDB is connected !! DB HOST : ${connectionInstance.connection.host}`)
    } catch (error) {
        console.log("DATABASE CONNECTION FAILED: ", error)
        process.exit(1)
    }
}

export default connectDB