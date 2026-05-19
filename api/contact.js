import { MongoClient } from 'mongodb';
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db('minis_db');
    
    try {
        const { name, email, message, type } = req.body;
        const settings = await db.collection('settings').findOne({ id: 'general' });
        const toEmail = settings?.contactEmail || process.env.FALLBACK_EMAIL;

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: true,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        await transporter.sendMail({
            from: `"Ministranten Website" <${process.env.SMTP_USER}>`,
            to: toEmail,
            replyTo: email,
            subject: `Neue Anfrage (${type}): von ${name}`,
            text: `Name: ${name}\nE-Mail: ${email}\n\nNachricht:\n${message}`
        });

        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        await client.close();
    }
}