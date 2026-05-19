import { MongoClient } from 'mongodb';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    // Sicherheit: Prüfe JWT Token
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Nicht autorisiert' });
    
    try {
        jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
    } catch (e) {
        return res.status(401).json({ error: 'Token ungültig' });
    }

    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db('minis_db');

    try {
        const { action, payload } = req.body;

        if (action === 'save_news') {
            await db.collection('news').insertOne({
                ...payload,
                timestamp: Date.now()
            });
            res.status(200).json({ success: true });
        } 
        else if (action === 'save_settings') {
            await db.collection('settings').updateOne(
                { id: 'general' }, 
                { $set: payload }, 
                { upsert: true }
            );
            res.status(200).json({ success: true });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        await client.close();
    }
}