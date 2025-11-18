import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/User";
import {success, z } from "zod";
import {usernameValidation} from "@/schemas/signupSchema";

const UsernameQuerySchema = z.object({
    username: usernameValidation
})

export async function GET(req: Request) {
    await dbConnect();

    try {
        const {searchParams} = new URL(req.url);
        const queryParam = {
            username: searchParams.get('username')
        }
        const result = UsernameQuerySchema.safeParse(queryParam);

        if (!result.success) {
            const usernameErrors = result.error.format().username?._errors || [];
            return Response.json({ 
                success: false, 
                message: usernameErrors?.length > 0 ? usernameErrors.join(', ') : 'Invalid Query Parameters'}, { status: 400 });
        }

        const { username } = result.data;
        const existingVerifiedUser = await UserModel.findOne({ username, isVerified: true });

        if (existingVerifiedUser) {
            return Response.json({ 
                success: false, 
                message: 'Username is already taken' }, { status: 400 });
        } else {
            return Response.json({ 
                success: true, 
                message: 'Username is unique' }, { status: 200 });
        }
    } catch (error) {
        console.error("Error checking username: ", error);
        return Response.json({ success: false, error: 'Error checking username' }, { status: 500 });
    }
}
