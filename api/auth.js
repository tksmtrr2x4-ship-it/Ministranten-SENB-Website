import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method not allowed');
    
    const { username, password } = req.body;
    
    // Die Zugangsdaten aus den Umgebungsvariablen (Vercel)
    const ADMIN_USER = process.env.ADMIN_USER || 'admin';
    const ADMIN_PW = process.env.ADMIN_PASSWORD || 'redakteur2026'; 

    if (username === ADMIN_USER && password === ADMIN_PW) {
        const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '8h' });
        res.status(200).json({ token });
    } else {
        res.status(401).json({ error: 'Falsche Zugangsdaten' });
    }
}