import nodemailer from 'nodemailer';

interface SendEmailProps {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendEmail = async ({ to, subject, html, text }: SendEmailProps) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    html,
    text,
  };

  // Send the email to the user
  await transporter.sendMail(mailOptions);

  // Send a backup to the admin
  const adminEmail = process.env.ADMIN_EMAIL;
  await transporter.sendMail({ ...mailOptions, to: adminEmail });
};

export default sendEmail;
