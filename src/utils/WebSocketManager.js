import { HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr'
import eventBus from './EventBus'

const socket = new HubConnectionBuilder()
    .withUrl("http://novip.gridea.run/p2p")
    .build();

if (socket.state != HubConnectionState.Connected) {
    socket.start();
}

socket.on("created", function (roomId) {
    console.log("Created room", roomId);
    eventBus.emit("onCreatedRoom", roomId);
});

socket.on("joined", function (roomId) {
    console.log("This peer has joined room", roomId);
    eventBus.emit("onJoinedRoom", roomId);
});

socket.on("message", function (message) {
    console.log("Client received message:", message);
    eventBus.emit("onSignalingMessage", message);
    
});

export default socket