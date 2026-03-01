import jwt from 'jsonwebtoken';
import User from '@/lib/models/User';

export async function verifyAuth(token) {
    try {
        if(!token){
            return null;
        }
        const tokenString = token.startsWith('Bearer ') ? token.slice(7) : token;

        const decoded = jwt.verify(tokenString, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');

        return user;
    }catch(error) {
        console.error('Auth verification error:', error);
        return null;
    }
}

export function generateToken(userId) {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {expiresIn: '30min'});
}