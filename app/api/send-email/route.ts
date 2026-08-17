import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, data } = body;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    let emailHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e5e7eb; border-radius: 10px; max-w: 600px; margin: auto;">
        <h2 style="color: #2563eb; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">🚨 Alert: ${type}</h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
    `;

    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'object' && value !== null) {
        emailHtml += `<tr><td style="padding: 10px; background-color: #f8fafc; font-weight: bold; border: 1px solid #e5e7eb;" colspan="2">${key.toUpperCase()}</td></tr>`;
        for (const [subKey, subValue] of Object.entries(value)) {
          emailHtml += `<tr>
            <td style="padding: 10px; border: 1px solid #e5e7eb; padding-left: 20px; width: 40%; color: #475569; font-weight: bold;">${subKey}</td>
            <td style="padding: 10px; border: 1px solid #e5e7eb; color: #0f172a;">${subValue || 'N/A'}</td>
          </tr>`;
        }
      } else {
        emailHtml += `<tr>
          <td style="padding: 10px; background-color: #f8fafc; border: 1px solid #e5e7eb; width: 40%; font-weight: bold; color: #475569;">${key.replace(/_/g, ' ').toUpperCase()}</td>
          <td style="padding: 10px; border: 1px solid #e5e7eb; color: #0f172a;">${value || 'N/A'}</td>
        </tr>`;
      }
    }
    
    emailHtml += `</table>
      <p style="margin-top: 20px; font-size: 12px; color: #94a3b8;">This is an automated email from your Next.js Website.</p>
    </div>`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Yeh email sidha aapko aayega
      subject: `New Notification: ${type}`,
      html: emailHtml,
    };

    await transporter.sendMail(mailOptions);
    return NextResponse.json({ success: true, message: 'Email sent successfully!' });

  } catch (error: any) {
    console.error("Email Error: ", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}