const nodemailer = require("nodemailer");

// 邮箱发送成功就返回真，反之为假
module.exports = async (title, email, url) => {
  const transporter = nodemailer.createTransport({
    service: "qq", // 类型qq邮箱
    port: 465, // 上文获取的port
    secure: true, // 上文获取的secure
    auth: {
      user: "3108521253@qq.com", // 发送方的邮箱，可以选择你自己的qq邮箱
      pass: "yttlyjoxwmordhef", // SMTP/IMAP 服务授权码
    },
  });

  const mailOptions = {
    from: `w1<3108521253@qq.com>`, // 发件人
    subject: title, //邮箱主题
    to: email, //收件人，这里由post请求传递过来
    // 邮件内容，用html格式编写
    html: ` <br />
            <p>专题链接：<br />
            <a href="${url}#/" target="_blank">${url}#/</a></p>
            <p>check页面：<br />
            <a href="${url}#/check" target="_blank">${url}#/check</a></p>
         `,
  };
  try {
    const info = await transporter.sendMail(mailOptions);
    if (info) {
      return true;
    }
  } catch (error) {
    return false;
  }
};
