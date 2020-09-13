<template>
  <button @click="createRoom">文件已选好</button>
  <ol>
    <li v-for="(file,index) in receiveFileList" :key="index">{{ file }}</li>
  </ol>
</template>

<script>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import socket from "../utils/WebSocketManager";
import eventBus from "../utils/EventBus";
import { Peer } from "../utils/Peer";

export default {
  setup() {
    const router = useRouter();
    const sendFileList = ref([]);
    const receiveFileList = ref([]);
    const peer = new Peer();

    const createRoom = () => {
      socket.invoke("CreateRoom").catch(function (err) {
        return console.error(err.toString());
      });
    };

    const sendMessage = () => {
      peer.sendData();
    };

    const onReceiveMessage = (e) => {
      if (typeof e.data == "string") {
        receiveFileList.value.push(e.data);
      }
    };

    // 信令服务器交换信息
    const onSignalingMessage = (message) => {
      peer.signalingMessageCallback(message);
    };

    // 房间创建成功后 打开数据通道 等待连接
    const onCreatedRoom = (roomId) => {
      peer.connectPeer(roomId, false);
    };

    onMounted(() => {
      eventBus.on("onCreatedRoom", onCreatedRoom);
      eventBus.on("onSignalingMessage", onSignalingMessage);

      peer.on("onReceiveMessage", onReceiveMessage);
    });

    return { createRoom, receiveFileList };
  },
};
</script>
