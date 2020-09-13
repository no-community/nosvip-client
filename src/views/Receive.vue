<template>
  <h1>房间号: {{roomId}} 接收端</h1>
  <button @click="joinRoom(roomId)">加入房间</button>
  <button @click="sendMessage">发消息</button>
  <p>{{message}}</p>
</template>

<script>
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import socket from "../utils/WebSocketManager";
import eventBus from "../utils/EventBus";
import { Peer } from "../utils/Peer";

export default {
  setup() {
    const route = useRoute();
    const roomId = computed(() => route.params.rid);
    const message = ref("");
    const peer = new Peer();

    const joinRoom = (roomId) => {
      socket.invoke("JoinRoom", roomId).catch(function (err) {
        return console.error(err.toString());
      });
    };

    const sendMessage = () => {
      peer.sendData();
    };

    const onJoinedRoom = (roomId) => {
      peer.connectPeer(roomId, true);
    };

    const onReceiveMessage = (msg) => {
      message.value = msg;
    };

    const onSignalingMessage = (message) => {
      peer.signalingMessageCallback(message);
    };

    onMounted(() => {
      eventBus.on("onJoinedRoom", onJoinedRoom);
      eventBus.on("onSignalingMessage", onSignalingMessage);
      peer.on("onReceiveMessage", onReceiveMessage);
    });
    return { roomId, sendMessage, joinRoom, message };
  },
};
</script>
