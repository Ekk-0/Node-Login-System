import { createServer } from 'http';
import { readFile, existsSync } from 'fs';
import path from 'path';
import {login, register } from './database/index.js';
import dotenv from 'dotenv';
dotenv.config();


const hostname = process.env.IP_ADDRESS;
const port = 8080;

const server = createServer(async (req, res) => {

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

            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            req.on('end', async () => {

                const formData = JSON.parse(body);
                console.log(formData);
                if (filePath === '/login.html') {
                    let auth = await login(formData);
                    console.log(auth);
                    if (auth === null) {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(body);
                    } else {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(body);
                    }
                } else if (filePath === '/register.html') {
                    let auth = await register(formData);
                    console.log(auth);
                    if (auth === null) {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(body);
                    } else {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(body);
                    }
                }
            });
    }
});
server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});