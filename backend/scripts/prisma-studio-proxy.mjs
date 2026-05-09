import net from 'node:net';

const listenHost = process.env.PRISMA_STUDIO_PROXY_HOST ?? '0.0.0.0';
const listenPort = Number(process.env.PRISMA_STUDIO_PROXY_PORT ?? 5555);
const targetHost = process.env.PRISMA_STUDIO_HOST ?? '127.0.0.1';
const targetPort = Number(process.env.PRISMA_STUDIO_PORT ?? 5556);

const server = net.createServer((client) => {
    const target = net.createConnection({ host: targetHost, port: targetPort });

    client.pipe(target);
    target.pipe(client);

    const closeBoth = () => {
        client.destroy();
        target.destroy();
    };

    client.on('error', closeBoth);
    target.on('error', closeBoth);
});

server.listen(listenPort, listenHost, () => {
    console.log(
        `Prisma Studio proxy is running at http://localhost:${listenPort} -> ${targetHost}:${targetPort}`,
    );
});
