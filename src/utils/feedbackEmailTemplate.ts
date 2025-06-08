interface FeedbackEmailTemplateProps {
  name: string;
  email: string;
  message: string;
}

const feedbackEmailTemplate = ({ name, email, message }: FeedbackEmailTemplateProps): string => {
  const siteName = process.env.NEXT_PUBLIC_SITENAME;
  const siteUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const currentTime = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });

  return `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <table width="100%" border="0" cellpadding="0" cellspacing="0">
          <tr>
            <td style="background-color: #f3e0c5; padding: 20px; text-align: center;">
              <h1 style="color: #262626;">您提供的回饋</h1>
              <p style="color: #262626; font-size: 16px;">我們收到的時間：${currentTime}</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px;">
              <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                <p style="font-size: 16px; margin: 5px 0;"><strong>使用者姓名：</strong> ${name}</p>
                <p style="font-size: 16px; margin: 5px 0;"><strong>聯絡信箱：</strong> ${email}</p>
              </div>
              <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">
                <p style="font-size: 16px; margin-bottom: 10px;"><strong>您珍貴的回饋內容：</strong></p>
                <p style="font-size: 16px; color: #333; white-space: pre-wrap; margin: 0;">${message}</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px; text-align: center; border-top: 1px solid #eee;">
              <p style="font-size: 12px; color: #999;">
                來自 <a href="${siteUrl}" style="color: #cf4f2c; text-decoration: none;">${siteName}</a> 的系統通知
              </p>
            </td>
          </tr>
        </table>
      </div>
    `;
};

export default feedbackEmailTemplate;
