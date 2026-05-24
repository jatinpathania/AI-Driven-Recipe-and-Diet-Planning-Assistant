import jwt from 'jsonwebtoken';
import User from '@/lib/models/User';
import { getToken } from 'next-auth/jwt';

export async function verifyAuth(requestOrToken) {
    try {
        if (!requestOrToken) {
            return null;
        }
        if (typeof requestOrToken === 'object' && requestOrToken.headers && typeof requestOrToken.headers.get === 'function') {
            const authHeader = requestOrToken.headers.get('Authorization');
            if (authHeader) {
                const tokenString = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
                if (tokenString && tokenString !== 'null' && tokenString !== 'undefined') {
                    try {
                        const decoded = jwt.verify(tokenString, process.env.JWT_SECRET);
                        const user = await User.findById(decoded.id).select('-password');
                        if (user) return user;
                    } catch (e) {
                        // ignore and try next-auth
                    }
                }
            }

            const nextauth = await getToken({ req: requestOrToken, secret: process.env.NEXTAUTH_SECRET });
            if (nextauth && nextauth.id) {
                const user = await User.findById(nextauth.id).select('-password');
                return user;
            }
            return null;
        }

        const tokenString = requestOrToken.startsWith('Bearer ') ? requestOrToken.slice(7) : requestOrToken;
        const decoded = jwt.verify(tokenString, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');

        return user;
    } catch (error) {
        console.error('Auth verification error:', error);
        return null;
    }
}

export function generateToken(userId) {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {expiresIn: '1hr'});
}