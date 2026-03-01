import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import connectDB from "@/lib/db/connectDB"
import User from "@/lib/models/User"

const handler = NextAuth({
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
    ],
    session: {
        strategy: "jwt",
        maxAge: 30 * 60
    },
    secret: process.env.NEXTAUTH_SECRET,
    callbacks: {
        async signIn({ user, profile, account }) {
            try {
                await connectDB();

                // Check if user already exists by email
                let existingUser = await User.findOne({ email: user.email });

                if (!existingUser) {
                    // Create new user for Google OAuth
                    // Generate simple username from email prefix
                    let baseUsername = user.email.split('@')[0];
                    let username = baseUsername;
                    let counter = 1;
                    
                    // Check if username already exists and make it unique
                    while (await User.findOne({ username })) {
                        username = `${baseUsername}${counter}`;
                        counter++;
                    }
                    
                    existingUser = await User.create({
                        email: user.email,
                        username: username,
                        fullName: user.name || '',
                        profileImage: user.image || '',
                        authMethods: ['google']
                    });
                } else {
                    if (!existingUser.authMethods) {
                        existingUser.authMethods = [];
                    }
                    if (!existingUser.authMethods.includes('google')) {
                        existingUser.authMethods.push('google');
                    }
                    if (!existingUser.profileImage && user.image) {
                        existingUser.profileImage = user.image;
                    }
                    await existingUser.save();
                }

                user.id = existingUser._id.toString();
                user.username = existingUser.username;
                user.fullName = existingUser.fullName;
                return true;
            } catch (error) {
                console.error('SignIn callback error:', error);
                return false;
            }
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.username = user.username;
                token.fullName = user.fullName;
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id;
                session.user.username = token.username;
                session.user.fullName = token.fullName;
            }
            return session;
        }
    }
})

export { handler as GET, handler as POST }