import crypto from 'crypto';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.DATABASE_URI;
const client = new MongoClient(uri);

// GRUD DB
export async function login(formData) {
    try {
        await client.connect();
        const db = client.db('node-mongodb');
        const collection = db.collection('login');
        formData.password = crypto.createHash('sha256').update(formData.password).digest('base64');
        

        // Find the first document in the collection
        return await collection.findOne(formData);
    } finally {
        // Close the database connection when finished or an error occurs
        await client.close();
    }
}

export async function register(formData) {
    try {
        await client.connect();
        const db = client.db('node-mongodb');
        const collection = db.collection('login');
        formData.password = crypto.createHash('sha256').update(formData.password).digest('base64');

        // Find the first document in the collection
        return await collection.insertOne(formData);
    } finally {
        // Close the database connection when finished or an error occurs
        await client.close();
    }
}