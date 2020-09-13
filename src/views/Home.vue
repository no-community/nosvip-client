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

    const receivingFileId = ref(0);
    const receivingBuffer = ref([]);

    const createRoom = () => {
      socket.invoke("CreateRoom").catch(function (err) {
        return console.error(err.toString());
      });
    };

    const sendMessage = () => {
      peer.sendData();
    };

    const onReceiveMessage = (data) => {
      if (typeof data == "string") {
        console.log("接收到文本消息：", data);
        handleMessage(data);
      } else {
        console.log("接收到流数据:", data);
        receivingBuffer.value.push(data);
      }
    };

    const handleMessage = (msgText) => {
      const message = JSON.parse(msgText);
      if (message.type === "TransferStart") {
        receivingFileId.value = message.fileId;
      } else if (message.type === "TransferEnd") {
        const fileId = message.fileId;
        const blob = new Blob(receivingBuffer.value);

        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(blob);
        link.download = "test.xls";
        link.click();
        window.URL.revokeObjectURL(link.href);
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
