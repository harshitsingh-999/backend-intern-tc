import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve('c:/Users/TRE-2572/Desktop/internsystem/backend/.env') });

const user = process.env.EMAIL_USER;
const pass = process.env.EMAIL_PASS;

console.log("Attempting to connect with:", user);

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: user,
        pass: pass
    }
});

async function test() {
    try {
        console.log("Verifying connection...");
        await transporter.verify();
        console.log("✅ Connection SUCCESSFUL!");

        console.log("Sending test email...");
        const info = await transporter.sendMail({
            from: `"SMTP Test" <${user}>`,
            to: user,
            subject: "SMTP Test Work",
            text: "If you see this, the SMTP setup is working correctly."
        });
        console.log("✅ Email sent:", info.messageId);
    } catch (error) {
        console.error("❌ SMTP Error:", error);
    }
}

test();
