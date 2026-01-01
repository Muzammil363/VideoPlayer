import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const comparePasswords = async (plainPassword, hashedPassword) => {
    const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
    return isMatch;
}

export const generateToken = async (id,username) => {
    try {
        console.log("generating token with _id: ",id);
        const token = await new Promise((resolve, reject) => {
            jwt.sign(
                { _id: id, username: username },
                process.env.JWT_SECRET,
                { expiresIn: '1d' },
                (err, token) => {
                    if (err) {
                        reject('Error : ' + err);
                    } else {
                        resolve(token); 
                    }
                }
            );
        });
        
        return token;
    } catch (error) {
        console.log('Error : ', error);
        throw new Error('Token generation failed');
    }
};