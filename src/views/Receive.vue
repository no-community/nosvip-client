<template>
  <h1>房间号: {{roomId}} 接收端</h1>
  <button @click="joinRoom(roomId)">加入房间</button>
  <button @click="sendMessage">发消息</button>
  <input type="file" @change="tirggerFile($event)">
</template>

<script>
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import socket from "../utils/WebSocketManager";
import eventBus from "../utils/EventBus";
import peer from "../utils/Peer";
import FileChunker from "../utils/FileChunker";

export default {
  setup() {
    const route = useRoute();
    const roomId = computed(() => route.params.rid);
    const message = ref("");

    const joinRoom = (roomId) => {
      socket.invoke("JoinRoom", roomId).catch(function (err) {
        return console.error(err.toString());
      });
    };

    const sendMessage = () => {
      peer.sendJson();
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

    const tirggerFile = async (e) => {
        const chunker = new FileChunker(event.target.files[0]);
        console.log("开始传输文件...")
        await peer.sendJson({
          type: 'TransferStart',
          fileId: 0,
        });
        let done = false;
        while (!done) {
          const result = await chunker.getNextChunk();
          done = result.done;
          const {
            chunk,
            offset,
          } = result;
          try {
            await peer.send(chunk);
          } catch (err) {
            console.log('传输错误：' + err);
            break;
          }
        }

        console.log("传输文件完成...")
        if (done) {
          await peer.sendJson({
            type: 'TransferEnd',
            fileId: 0,
          });
        }
    }

    onMounted(() => {
      eventBus.on("onJoinedRoom", onJoinedRoom);
      eventBus.on("onSignalingMessage", onSignalingMessage);
      peer.on("onReceiveMessage", onReceiveMessage);
    });
    return { roomId, sendMessage, joinRoom, message, tirggerFile };
  },
};
</script>
