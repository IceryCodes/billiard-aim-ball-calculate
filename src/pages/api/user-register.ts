import bcrypt from 'bcrypt';
import { InsertOneResult, ObjectId } from 'mongodb';
import { NextApiRequest, NextApiResponse } from 'next';
import { ValidationError } from 'yup';

import { UserRoleType } from '@/domains/interface';
import { UserWithPasswordProps } from '@/domains/user';
import { getUsersCollection } from '@/lib/mongodb';
import { registerValidationSchema } from '@/lib/validation';
import { UserLoginReturnType } from '@/services/interfaces';
import { HttpStatus } from '@/utils/api';
import sendEmail from '@/utils/sendEmail';
import { generateToken } from '@/utils/token';
import verificationEmailTemplate from '@/utils/verificationEmailTemplate';

const handler = async (req: NextApiRequest, res: NextApiResponse<UserLoginReturnType>) => {
  if (req.method !== 'POST') {
    return res.status(HttpStatus.MethodNotAllowed).json({ message: 'Method not allowed' });
  }

  const { firstName, lastName, gender, email, password } = req.body;

  try {
    await registerValidationSchema.validate(req.body, { abortEarly: false });

    const hashedPassword = await bcrypt.hash(password, 10);
    const usersCollection = await getUsersCollection();

    // Check if the email already exists
    const existingUser = await usersCollection.findOne({ email, isVerified: true });
    if (existingUser) {
      return res.status(HttpStatus.BadRequest).json({ message: '此電子郵件已被註冊' });
    }

    const timeStamp: Date = new Date();

    const newUser: Omit<UserWithPasswordProps, '_id'> = {
      firstName,
      lastName,
      gender,
      email,
      password: hashedPassword,
      role: UserRoleType.None,
      isVerified: false,
      createdAt: timeStamp,
      updatedAt: timeStamp,
    };

    const result: InsertOneResult<Omit<UserWithPasswordProps, '_id'>> = await usersCollection.insertOne(newUser);
    const userId: ObjectId = result.insertedId; // Get the generated ObjectId

    const verificationToken: string = await generateToken({
      user: { _id: userId.toString(), ...newUser },
      manage: {
        courts: [],
        players: [],
      },
      isRegister: true,
    });
    const verificationLink = `${process.env.NEXT_PUBLIC_BASE_URL}/verify?token=${verificationToken}`;
    await sendEmail({
      to: email,
      subject: `[${process.env.NEXT_PUBLIC_SITENAME}] 歡迎${lastName} ${firstName}進行信箱驗證!`,
      html: verificationEmailTemplate({ userName: `${lastName} ${firstName}`, verificationLink }),
    });

    res.status(HttpStatus.Created).json({ message: '請至註冊信箱進行驗證' });
  } catch (error) {
    if (error instanceof ValidationError)
      return res.status(HttpStatus.BadRequest).json({ message: error.errors.join(', ') });

    console.error('Error register user details:', error);
    res.status(HttpStatus.InternalServerError).json({ message: `Server error: ${error}` });
  }
};

export default handler;
