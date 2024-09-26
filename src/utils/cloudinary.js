import dotenv from "dotenv"
import {v2 as cloudinary} from "cloudinary"
import fs from "fs"
dotenv.config()

cloudinary.config(
    {
        cloud_name : process.env.CLOUD_NAME,
        api_key : process.env.CLOUD_API_KEY,
        api_secret : process.env.CLOUD_API_SECRET
    }
)

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null

        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type : "auto"
        })
        //file has been uploaded successfully
        // console.log("file is uploaded on cloudinary", response.url)

        fs.unlinkSync(localFilePath)

        return response;
    } catch (error) {
        fs.unlink(localFilePath) //remove the locally saved temporary file as the the upload operation got failed
        return null
    }
}

export { uploadOnCloudinary }