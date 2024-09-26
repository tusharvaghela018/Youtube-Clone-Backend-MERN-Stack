import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"

const registerUser = asyncHandler( async (req,res) => 
    {
        // ---requirements for the registration----
        //get user deatil from frontend
        //validation - not empty
        //check if user already exist
        //check for images, check the avatar
        //if yes , upload on cloudinary
        //create user object - create an entry in DB
        //remove password and refresh token from the response
        //checck for the user creation
        //return res

        const {fullName, email, username, password} = req.body

        // console.log("email: ", email)

        // if(fullName === ""){
        //     throw new ApiError(400, "Fullname is required")
        // }

        if(
            [fullName,email, password, username].some((field)=>
                
                field?.trim() === ""
            )
        ){
            throw new ApiError(400, "All fields are required")
        }

        const existedUser = await User.findOne({
            $or : [{ username },{ email }]
        })

        if(existedUser){
            throw new ApiError(409,"User with same Username or email is already exist")
        }

        const avatarLocalPath = req.files?.avatar[0]?.path

        // const coverImageLocalsPath = req.files?.coverImage[0]?.path

        let coverImageLocalPath;

        if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
            coverImageLocalPath = req.files.coverImage[0].path
        }

        if(!avatarLocalPath){
            throw new ApiError(400, "Avatar file is required")
        }

        const avatar = await uploadOnCloudinary(avatarLocalPath)

        const coverImage = await uploadOnCloudinary(coverImageLocalPath)

        if(!avatar){
            throw new ApiError(400, "Avatar file is required")
        }

        const user = await User.create({
            fullName,
            avatar : avatar.url,
            coverImage : coverImage?.url || "",
            email,
            password,
            username : username.toLowerCase()
        })

        const createdUser = await User.findById(user._id).select(
            "-password -refreshToken"   
        )

        if(!createdUser){
            throw new ApiError(500, "something went wrong while registring the new user")
        }

        return res.status(201).json(
            new ApiResponse(200, createdUser, "user registered successfully")
        )
    }
)

//Login User controller

const loginUser = asyncHandler( async(req,res)=>{

    // req.body -> data
    //username or email
    //find the user
    //password check
    //generate the access and refresh token
    //send cookie

    const generateAccessAndRefreshToken = async(userId) => {
        try {
            const user = await User.findById(userId)
            const accessToken = user.generateAccessToken()
            const refreshToken = user.generateRefreshToken()

            user.refreshToken = refreshToken

            await user.save({ validateBeforeSave : false })

            return {accessToken, refreshToken}
        } catch (error) {
            throw new ApiError(500, "Something went wrong while egenerating the access and refresh token")
        }
    }

    const {email, username, password} = req.body

    if(!(username || email)){
        throw new ApiError(400, "username or email is required")
    }

    const user = await User.findOne({
        $or : [{ email }, { username }]
    })

    if(!user){
        throw new ApiError(404, "user not found")
    }

    const isPasswordvalid = await user.isPasswordCorrect(password)

    if(!isPasswordvalid){
        throw new ApiError(400, "Password is incorrect!")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly : true,
        secure : true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user : loggedInUser, accessToken, refreshToken
            },
            "user logged in successfully."
        )
    )
})

//logout user

const logoutUser = asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set :{
                refreshToken : undefined
            }
            
        },
        {
            new : true
        }
    )

    const options = {
        httpOnly : true,
        secure : true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken",options)
    .json( new ApiResponse(200, {}, "User logged Out successfully"))
})

// refresh the Access Token
const refreshAccessToken = asyncHandler(async(req,res)=>{
    const incomingRefreshToken =  req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "refresh token is expired or used")
        }
    
        const options = {
            httpOnly : true,
            secure : true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshToken(user._id)
    
        return res
        .status(200)
        .cookies("accessToken", accessToken, options)
        .cookies("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {accessToken, refreshToken : newRefreshToken},
                "Access token refreshed successfully"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})

export { registerUser, loginUser, logoutUser, refreshAccessToken }