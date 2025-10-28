import { WebSocket, MessageEvent } from "ws";
const baseUrl = `ws${process.env.DEV ? 's://socket.daalbot.xyz' : '://localhost:8000'}`

let client: DaalBotSocketClient | null = null;

export function getClient(): DaalBotSocketClient {
    if (client === null) {
        client = new DaalBotSocketClient(process.env.BotCommunicationKey!);
        return client;
    }
    return client;
}

export interface ReadDirResult {
    name: string;
    isFile: boolean;
    isDirectory: boolean;
    isSymlink: boolean;
    content?: string;
    children?: ReadDirResult[];
}

class DaalBotSocketClient {
    private socket!: WebSocket;
    private shouldBeClosed: boolean = false;
    private auth: string;
    private pingInterval: ReturnType<typeof setInterval> | null = null;
    public uuid: string | null = null;

    constructor(auth: string) {
        this.auth = auth;
        this.connect();
    }

    private connect(): void {
        this.socket = new WebSocket(baseUrl);
        this.setupEventHandlers();
    }

    private setupEventHandlers(): void {
        this.socket.onopen = async () => {
            await new Promise((resolve) => setTimeout(resolve, 200));
            console.log('Socket connection established. Sending authentication...');
            this.socket.send(JSON.stringify({
                type: 'authenticate',
                token: this.auth
            }));

            const authResponse = await this.waitUntilType('authenticateResponse');
            if (authResponse.level === 'error') {
                console.error('Authentication failed:', authResponse.data);
                this.socket.close();
                return;
            }

            this.uuid = authResponse.data.uuid;
            console.log('Authenticated successfully with UUID:', this.uuid);

            this.startPingInterval();
        }

        this.socket.onclose = (event) => {
            // Clear ping interval when connection closes
            if (this.pingInterval !== null) {
                clearInterval(this.pingInterval);
                this.pingInterval = null;
            }

            // Reset UUID
            this.uuid = null;

            if (!this.shouldBeClosed) {
                console.log(`Socket closed unexpectedly (code: ${event.code}). Reconnecting after 3 seconds...`);
                setTimeout(() => {
                    this.connect();
                }, 3000);
            } else {
                console.log('Socket connection closed.');
            }
        }

        this.socket.onerror = (error) => {
            console.error('WebSocket error:', error);
        }
    }

    private startPingInterval(): void {
        // Clear any existing ping interval
        if (this.pingInterval !== null) {
            clearInterval(this.pingInterval);
        }

        let failedPingsInRow = 0;
        let lastPingFailed = false;

        this.pingInterval = setInterval(async () => {
            if (this.socket.readyState !== WebSocket.OPEN) {
                return;
            }

            this.socket.send(JSON.stringify({
                type: 'echo',
                data: { text: 'ping' }
            }));

            // Wait atmost 10 seconds for a echoResponse otherwise consider it failed
            const pingTimeout = setTimeout(() => {
                if (lastPingFailed) {
                    failedPingsInRow += 1;
                } else {
                    lastPingFailed = true;
                    failedPingsInRow = 1;
                }

                console.error('Ping to socket timed out.');
            }, 10 * 1000);

            try {
                const response = await this.waitUntilType('echoResponse');
                clearTimeout(pingTimeout);

                if (response.data.text === 'ping') {
                    lastPingFailed = false;
                    failedPingsInRow = 0;
                }
            } catch (error) {
                clearTimeout(pingTimeout);
                console.error('Error waiting for ping response:', error);
                failedPingsInRow += 1;
            }

            if (failedPingsInRow >= 3) {
                console.error('Connection to socket considered dead. Reconnecting...');
                this.socket.close();
            }
        }, 30 * 1000);
    }

    public onAuthenticated(callback: () => void): void {
        const checkAuth = setInterval(() => {
            if (this.uuid !== null) {
                clearInterval(checkAuth);
                callback();
            }
        }, 100);
    }

    public sendMessage(message: string): void {
        if (this.socket.readyState !== WebSocket.OPEN) {
            console.error('Cannot send message: WebSocket is not connected');
            return;
        }
        this.socket.send(message);
    }

    public isConnected(): boolean {
        return this.socket.readyState === WebSocket.OPEN && this.uuid !== null;
    }

    public closeConnection(): void {
        this.shouldBeClosed = true;
        if (this.pingInterval !== null) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
        this.socket.close();
    }

    // deno-lint-ignore no-explicit-any
    public waitUntilType(type: string, timeout: number = 30000): Promise<{ level: string, type: string, data: any }> {
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                this.socket.removeEventListener("message", messageHandler);
                reject(new Error(`Timeout waiting for message type: ${type}`));
            }, timeout);

            const messageHandler = (event: MessageEvent) => {
                try {
                    const data = typeof event.data === 'string' ? event.data : event.data.toString();
                    const message = JSON.parse(data);
                    if (message.type === type) {
                        clearTimeout(timeoutId);
                        this.socket.removeEventListener("message", messageHandler);
                        resolve(message);
                    }
                } catch (error) {
                    console.error('Error parsing message:', error);
                }
            };

            this.socket.addEventListener("message", messageHandler);
        });
    }

    public async readFile(path: string): Promise<string> {
        if (this.socket.readyState !== WebSocket.OPEN) {
            throw new Error('WebSocket is not connected');
        }

        this.socket.send(JSON.stringify({
            type: 'fileRead',
            data: { path }
        }));

        const response = await this.waitUntilType('fileReadResponse');
        if (response.level === 'error') {
            throw new Error(response.data);
        }
        return response.data;
    }

    public async writeFile(path: string, content: string, encrypt: boolean = true): Promise<void> {
        if (this.socket.readyState !== WebSocket.OPEN) {
            throw new Error('WebSocket is not connected');
        }

        this.socket.send(JSON.stringify({
            type: 'fileWrite',
            data: { path, content, encrypt }
        }));

        const response = await this.waitUntilType('fileWriteResponse');
        if (response.level === 'error') {
            throw new Error(response.data);
        }
    }

    public async deleteFile(path: string): Promise<void> {
        if (this.socket.readyState !== WebSocket.OPEN) {
            throw new Error('WebSocket is not connected');
        }

        this.socket.send(JSON.stringify({
            type: 'fileDelete',
            data: { path }
        }));

        const response = await this.waitUntilType('fileDeleteResponse');
        if (response.level === 'error') {
            throw new Error(response.data);
        }
    }

    public async statFile(path: string): Promise<Deno.FileInfo> {
        if (this.socket.readyState !== WebSocket.OPEN) {
            throw new Error('WebSocket is not connected');
        }

        this.socket.send(JSON.stringify({
            type: 'fileStat',
            data: { path }
        }));

        const response = await this.waitUntilType('fileStatResponse');
        if (response.level === 'error') {
            throw new Error(response.data);
        }
        return response.data;
    }

    public async fileExists(path: string): Promise<boolean> {
        try {
            await this.statFile(path);
            return true;
        } catch {
            return false;
        }
    }

    public async readDir(path: string, readContents: boolean = false, recursive: boolean = false): Promise<ReadDirResult[]> {
        if (this.socket.readyState !== WebSocket.OPEN) {
            throw new Error('WebSocket is not connected');
        }

        this.socket.send(JSON.stringify({
            type: 'dirRead',
            data: {
                path,
                readContents,
                recursive
            }
        }));

        const response = await this.waitUntilType('dirReadResponse');
        if (response.level === 'error') {
            throw new Error(response.data);
        }

        return response.data;
    }

    public async createDir(path: string): Promise<void> {
        if (this.socket.readyState !== WebSocket.OPEN) {
            throw new Error('WebSocket is not connected');
        }

        this.socket.send(JSON.stringify({
            type: 'dirCreate',
            data: { path }
        }));

        const response = await this.waitUntilType('dirCreateResponse');
        if (response.level === 'error') {
            throw new Error(response.data);
        }
    }

    public async deleteDir(path: string): Promise<void> {
        if (this.socket.readyState !== WebSocket.OPEN) {
            throw new Error('WebSocket is not connected');
        }

        this.socket.send(JSON.stringify({
            type: 'dirDelete',
            data: { path }
        }));

        const response = await this.waitUntilType('dirDeleteResponse');
        if (response.level === 'error') {
            throw new Error(response.data);
        }
    }
}