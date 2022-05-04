const path = require('path');
const net = require('net');
const fs = require('fs');

let dir = path.join(__dirname);

if(process.argv[2]){
    console.log('args: ', process.argv[2]);
    dir = path.join(process.argv[2]);
}

console.log(dir + ' is available');

const mime = {
    html: 'text/html',
    txt: 'text/plain',
    css: 'text/css',
    gif: 'image/gif',
    jpg: 'image/jpeg',
    png: 'image/png',
    svg: 'image/svg+xml',
    js: 'application/javascript'
};

const methods = ['GET', 'POST', 'OPTIONS'];

const forbidden_path = '/var/';

let server = net.createServer((con) => {
    let input = '';
    con.on('data', (data) => {
        input += data;
        if (input.match(/\n\r?\n\r?/)) {
            let line = input.split(/\n/)[0].split(' ');
            let method = line[0], url = line[1], pro = line[2];
            let url_path = url.split('/');
            url_path.splice(0, 1);
            let reqpath = url.toString().split('?')[0];
            
            if ((method !== 'GET') && (method !== 'POST') && (method !== 'OPTIONS')) {
                let body = 'Method not implemented';
                con.write('HTTP/1.1 501 Not Implemented\n');
                con.write('Access-Control-Allow-Origin: *\n');
                con.write('Access-Control-Allow-Methods: ' + methods.join(', ') + '\n');
                con.write('Content-Type: text/plain\n');
                con.write('Content-Length: ' + body.length + '\n\n');
                con.write(body);
                con.destroy();
                fs.appendFileSync(__dirname + '/logs.txt', 'query with method' + method + '. ' + body + '\n');
                console.log(body);
                return;
            }
            if(method === 'POST') {
                con.write('HTTP/1.1 200 OK\n\n');
                con.write('Access-Control-Allow-Origin: *\n');
                con.write('Access-Control-Allow-Methods: ' + methods.join(', ') + '\n');
                con.write('Content-Type: text/plain\n');
                con.write('Content-Length: ' + data.length + '\n\n');
                con.write(data);
                con.destroy();
                return;
            }
            if(method === 'OPTIONS') {
                con.write('HTTP/1.1 200 OK\n\n');
                con.write('Access-Control-Allow-Origin: *\n');
                con.write('Access-Control-Allow-Methods: ' + methods.join(', ') + '\n');
                con.write('Allow: ' + methods.join(', ') + '\n');
                con.write('Content-Type: text/plain\n');
                con.write('Content-Length: ' + data.length + '\n\n');
                con.write(data);
                con.destroy();
                return;
            }

            let file = path.join(dir, reqpath.replace(/\/$/, '/index.html'));
            if (dir.includes(forbidden_path)) {
                console.log('Error access to dir: Forbidden');
                let body = 'Forbidden';
                con.write('HTTP/1.1 403 Forbidden\n');
                con.write('Content-Type: text/plain\n');
                con.write('Content-Length: ' + body.length + '\n\n');
                con.write(body);
                con.destroy();
                return;
            }
            let type = mime[path.extname(file).slice(1)] || 'text/plain';
			
			let s = fs.readFile(file, (err, data) => {
                if (err) {
                    let body;
                    if(url_path.length !== 0) {
                        file_path = dir + '/';
                        url_path.forEach((item, index, array) => {
                            file_path += item;
                            file_path += '/';
                        });
                        file_path = file_path.substring(0, file_path.length - 1);
                        console.log('visited url: ', url);
                        fs.appendFileSync(__dirname + '/logs.txt', 'visited url: ' + url + '\n');
                        fs.readdir(file_path, (err, items) => {
                            
                            body = '';
                            if(items){
                                items.forEach((item) => {
                                    if(url === '/'){
                                        body += '<a href="/' + item + '">' + item + '</a><br />';
                                    }
                                    else {
                                        body += '<a href="' + url + '/' + item + '">' + item + '</a><br />';
                                    }
                                    
                                });
                                con.write('HTTP/1.1 200 OK\n');
                                con.write('Access-Control-Allow-Origin: *\n');
                                con.write('Access-Control-Allow-Methods: ' + methods.join(', ') + '\n');
                                con.write('Content-Type: text/html\n');
                                con.write('Content-Length: ' + body.length + '\n\n');
                                con.write(body);
                                con.destroy();
                                fs.appendFileSync(__dirname + '/logs.txt', url + ' contents is shown\n');
                                console.log('directory contents is shown');
                            }
						}
					}
				}
			}
        }
    });
});

server.listen(3000, () => {
    console.log('Listening on http://localhost:3000/');
});
