import { MongoClient } from 'mongodb';

export default async function handler(req, res) {
    const client = new MongoClient(process.env.MONGODB_URI);
    try {
        await client.connect();
        const db = client.db('minis_db');

        const news = await db.collection('news').find().sort({ timestamp: -1 }).toArray();
        const settings = await db.collection('settings').findOne({ id: 'general' });
        
        // Tagesaktuelles Bibelzitat laden (kostenlose externe API)
        const quoteRes = await fetch('https://bible-api.com/?random=verse');
        const quoteData = await quoteRes.json();

        res.status(200).json({ 
            news, 
            settings: settings || { contactEmail: '', pdfUrl: '' },
            quote: { text: quoteData.text, ref: quoteData.reference }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        await client.close();
    }
}