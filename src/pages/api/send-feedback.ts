import { NextApiRequest, NextApiResponse } from 'next';
import { ValidationError } from 'yup';

import { SendFeedbackReturnType } from '@/services/interfaces';
import { HttpStatus } from '@/utils/api';
import feedbackEmailTemplate from '@/utils/feedbackEmailTemplate';
import sendEmail from '@/utils/sendEmail';

const handler = async (req: NextApiRequest, res: NextApiResponse<SendFeedbackReturnType>) => {
  if (req.method !== 'POST') {
    return res.status(HttpStatus.MethodNotAllowed).json({ message: 'Method not allowed' });
  }

  const { name, email, message } = req.body;

  try {
    await sendEmail({
      to: email,
      subject: `[${process.env.NEXT_PUBLIC_SITENAME}] ${name}感謝提交回饋給我們!`,
      html: feedbackEmailTemplate({ name, email, message }),
    });

    res.status(HttpStatus.Created).json({ message: '我們收到回饋囉，謝謝!' });
  } catch (error) {
    if (error instanceof ValidationError)
      return res.status(HttpStatus.BadRequest).json({ message: error.errors.join(', ') });

    console.error('Error register user details:', error);
    res.status(HttpStatus.InternalServerError).json({ message: `Server error: ${error}` });
  }
};

export default handler;
