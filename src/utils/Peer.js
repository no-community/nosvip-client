import EventEmitter from 'eventemitter3';
import socket from './WebSocketManager';

const BUFFERED_AMOUNT_LOW_THRESHOLD = 256 * 1024;
const BUF_WAITING_THRESHOLD = 1024 * 1024;

class Peer extends EventEmitter {
    constructor() {
        super();
        this.roomId = null;
        this.peerConnection = null;
        this.dataChannel = null;
        this.waitingCallback = null;
        this.isCaller = null;

        this.sendMessage = this.sendMessage.bind(this);
        this.setupDataChannel = this.setupDataChannel.bind(this);
        this.createRTCConnection = this.createRTCConnection.bind(this);
        this.onDescription = this.onDescription.bind(this);
        this.onIceCandidate = this.onIceCandidate.bind(this);
        this.connectPeer = this.connectPeer.bind(this);
        this.onConnectionStateChange = this.onConnectionStateChange.bind(this);
        this.onChannelOpen = this.onChannelOpen.bind(this);
        this.onChannelClose = this.onChannelClose.bind(this);
        this.onReceiveMessage = this.onReceiveMessage.bind(this);
        this.onBufferedAmountLow = this.onBufferedAmountLow.bind(this);
    }

    // 连接 peer
    connectPeer(roomId, iscaller) {
        if (iscaller) {
            console.log("start connect peer...");
        } else {
            console.log("waiting for remote description... (offer)")
        }
        this.roomId = roomId;
        this.createRTCConnection(iscaller);
    }

    createRTCConnection(isCaller) {
        const config = {
            iceServers: [
                {
                    urls: [
                        'turn:119.28.19.209:3478?transport=udp',
                        'turn:119.28.19.209:3478?transport=tcp'
                    ],
                    username: 'nosvip',
                    credential: '123456',
                },
                {
                    urls: ['stun:119.28.19.209:3478', 'stun:stun.l.google.com:19302', 'stun:global.stun.twilio.com:3478?transport=udp'],
                }
            ],
        };
        const peerConnection = new RTCPeerConnection(config);
        this.peerConnection = peerConnection;

        // 监听连接状态变化
        peerConnection.onconnectionstatechange = e => this.onConnectionStateChange(e);
        peerConnection.onicecandidate = this.onIceCandidate;

        this.isCaller = isCaller;
        if (isCaller) {
            const dataChannel = peerConnection.createDataChannel('file-transfer', { ordered: true });
            this.setupDataChannel(dataChannel);
            this.createOffer();
        } else {
            this.peerConnection.ondatachannel = e => {
                const dataChannel = e.channel || e.target;
                this.setupDataChannel(dataChannel);
            };
        }
    }

    createOffer() {
        console.log("create offer.")
        this.peerConnection.createOffer()
            .then(description => {
                this.onDescription(description);
            });
    }

    createAnswer() {
        console.log("create answer.")
        this.peerConnection.createAnswer()
            .then(description => {
                this.onDescription(description)
            });
    }

    onDescription(description) {
        this.peerConnection.setLocalDescription(description)
            .then(() => {
                this.sendMessage(description);
            })
            .catch(e => console.log('onDescription error: ', e));
    }

    // 监听 Ice 变化
    onIceCandidate(e) {
        if (!e.candidate) {
            return;
        }
        this.sendMessage({ ice: e.candidate });
    }

    // 监听连接状态变化
    onConnectionStateChange() {
        if (this.peerConnection.connectionState === 'disconnected') {
            if (this.peerConnection) {
                this.peerConnection.close();
            }
            if (this.waitingCallback) {
                this.waitingCallback(new Error('peer disconnected, cannot send'));
                this.waitingCallback = null;
            }
            this.emit('disconnected');
        } else if (this.peerConnection.connectionState === 'connected') {
            this.emit('connected');
        } else if (this.peerConnection.connectionState === 'connecting') {
            this.emit('connecting');
        } else if (this.peerConnection.connectionState === 'failed') {
            this.emit('connectFailed');
        }
        console.log('onConnectionStateChange: ', this.peerConnection.connectionState);
    }

    setupDataChannel(dataChannel) {
        this.dataChannel = dataChannel;
        dataChannel.bufferedAmountLowThreshold = BUFFERED_AMOUNT_LOW_THRESHOLD;
        dataChannel.binaryType = 'arraybuffer';
        dataChannel.onopen = this.onChannelOpen;
        dataChannel.onclose = this.onChannelClose;
        dataChannel.onerror = this.onChannelError;
        dataChannel.onbufferedamountlow = this.onBufferedAmountLow;
    }

    onChannelOpen(e) {
        console.log('## channel open: ', e);
        this.dataChannel.onmessage = this.onReceiveMessage;
    }

    onChannelClose(e) {
        console.log('## channel close: ', e);
    }

    onChannelError(e) {
        console.log('## channel error: ', e);
    }

    signalingMessageCallback(message) {
        if (message.type === 'offer') {
            console.log('Got offer. Sending answer to peer.');
            this.peerConnection.setRemoteDescription(new RTCSessionDescription(message)).then(_ => {
                this.createAnswer();
            });
        } else if (message.type === 'answer') {
            console.log('Got answer.');
            this.peerConnection.setRemoteDescription(new RTCSessionDescription(message));

        } else if (message.ice) {
            console.log("Got candidate.")
            this.peerConnection.addIceCandidate(message.ice).catch(e => {
                console.log("Failure during addIceCandidate(): " + e.name);
            });
        }
    }

    onBufferedAmountLow() {
        if (this.waitingCallback) {
            this.waitingCallback();
            this.waitingCallback = null;
        }
    }

    onReceiveMessage(e) {
        this.emit("onReceiveMessage", e.data);
    }

    send(data) {
        return new Promise((resolve, reject) => {
            if (this.dataChannel.readyState === 'open') {
                if (this.dataChannel.bufferedAmount >= BUF_WAITING_THRESHOLD) {
                    this.waitingCallback = (err) => {
                        if (err) {
                            reject(err);
                        } else {
                            this.dataChannel.send(data);
                            resolve();
                        }
                    };
                } else {
                    try {
                        this.dataChannel.send(data);
                        resolve();
                    } catch (e) {
                        console.error('send error: ', e);
                        reject(e);
                    }
                }
            } else {
                const errMsg = 'send but channel is not open, now state is: ' + this.peerConnection.readyState;
                console.error(errMsg);
                reject(new Error(errMsg));
            }
        });
    }

    sendJson(obj) {
        return this.send(JSON.stringify(obj));
    }

    sendMessage(message) {
        console.log('Client sending message: ', message);
        socket.invoke("SendMessage", this.roomId, message).catch(function (err) {
            return console.error(err.toString());
        });
    }

    logError(err) {
        if (!err) return;
        if (typeof err === 'string') {
            console.warn(err);
        } else {
            console.warn(err.toString(), err);
        }
    }
}

export { Peer }