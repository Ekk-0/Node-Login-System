import { createServer } from 'http';
import { readFile, existsSync } from 'fs';
import path from 'path';
import crypto from 'crypto';

import { login, register } from './database/index.js';
import {parseCookies, parseRequestBody} from './utils/index.js';

import dotenv from 'dotenv';
dotenv.config();

// In-memory session store
const sessions = {};

// Generate a random session ID
function generateSessionId() {
    return crypto.randomBytes(16).toString('hex');
}

const hostname = process.env.IP_ADDRESS;
const port = 8080;

const server = createServer(async (req, res) => {

    // Retrieve session ID from cookie
    let cookies = parseCookies(req.headers.cookie);
    let sessionId = cookies.sessionId;

    // If session ID not found or session has expired, create a new session
    if (!sessionId || !sessions[sessionId] || Date.now() > sessions[sessionId].expires) {
        sessionId = generateSessionId();
        sessions[sessionId] = {
            expires: Date.now() + (24 * 60 * 60 * 1000), // Session expires in 24 hours
            data: {}
        };
        res.setHeader('Set-Cookie', `sessionId=${sessionId}; HttpOnly; SameSite=Strict`);
    }

    // Retrieve session data
    const session = sessions[sessionId];

    let filePath = req.url === '/' ? '/index.html' : `${req.url}`;

    if (path.extname(filePath) === '') {
        filePath += '.html';
    }


    console.log(`HTTP:${req.httpVersion}: ${req.method}: ${filePath}`);

    switch (req.method) {
        case 'GET':
            readFile(`client/${filePath}`, (err, data) => {
                if (err) {
                    if (err.code === 'ENOENT') {
                        readFile('client/error/404.html', (err, data) => {
                            if (err) {
                                res.statusCode = 500;
                                res.setHeader('Content-Type', 'text/plain');
                                res.end('Internal Server Error');
                            } else {
                                res.statusCode = 200;
                                if (filePath.endsWith('.html')) {
                                    res.setHeader('Content-Type', 'text/html');
                                } else if (filePath.endsWith('.css')) {
                                    res.setHeader('Content-Type', 'text/css');
                                } else if (filePath.endsWith('.js')) {
                                    res.setHeader('Content-Type', 'text/javascript');
                                } else {
                                    res.setHeader('Content-Type', 'text/plain');
                                }
                                res.end(data);
                            }
                        });
                    } else {
                        res.statusCode = 500;
                        res.setHeader('Content-Type', 'text/plain');
                        res.end('Error: Could not read file');
                    }
                } else {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'text/html');
                    res.end(data);
                }
            });
            break;

        case 'POST':
            // Authenticate user and store user data in session
            const formData = await parseRequestBody(req);
            console.log(formData);

            if (filePath === '/login.html') {
                let user = await login(formData);
                console.log(user);
                if (user === null) {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ 'success': false }));
                } else {
                    session.data = user;
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ 'success': true }));
                }
            } else if (filePath === '/register.html') {
                let user = await register(formData);
                if (user === null) {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ 'success': false }));

                } else {
                    session.data = user;
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ 'success': true }));
                }
            } else if (filePath === '/logout.html') {
                // Destroy session
                delete sessions[sessionId];
                res.setHeader('Set-Cookie', `sessionId=; HttpOnly; SameSite=Strict; Expires=${new Date(0).toUTCString()}`);
                res.statusCode = 200;
                res.end(JSON.stringify({ 'success': true }));
            }

        default:
            return false;
    }
});


server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});