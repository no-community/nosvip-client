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

    onReceiveMessage(e) {
        this.emit("onReceiveMessage", e);
    }

    sendData() {
        //send file size and file name as comma separated value.
        this.dataChannel.send("hello world!");

        // const chunkSize = 16384;
        // fileReader = new FileReader();
        // let offset = 0;
        // fileReader.addEventListener('error', error => console.error('Error reading file:', error));
        // fileReader.addEventListener('abort', event => console.log('File reading aborted:', event));
        // fileReader.addEventListener('load', e => {
        //     console.log('FileRead.onload ', e);
        //     dataChannel.send(e.target.result);
        //     offset += e.target.result.byteLength;
        //     if (offset < file.size) {
        //         readSlice(offset);
        //     } else {
        //         alert(`${file.name} has been sent successfully.`);
        //         sendFileBtn.disabled = false;
        //     }
        // });
        // const readSlice = o => {
        //     console.log('readSlice ', o);
        //     const slice = file.slice(offset, o + chunkSize);
        //     fileReader.readAsArrayBuffer(slice);
        // };
        // readSlice(0);
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
