<template>
  <button @click="createRoom">创建房间</button>
  <p v-if="isWaiting">等待连接中...</p>
</template>

<script>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import socket from "../utils/WebSocketManager";
import eventBus from "../utils/EventBus";
import peer from "../utils/Peer";

export default {
  setup() {
    const router = useRouter();
    const roomId = ref(0);
    const isWaiting = ref(false);

    const createRoom = async () => {
      try {
        await socket.invoke("CreateRoom");
      } catch (error) {
        console.error(err.toString());
      }
    };

    const onChannelOpen = ()=> {
        isWaiting.value = false;
        router.push(`/s/${roomId}`);
    }

    // 信令服务器交换信息
    const onSignalingMessage = (message) => {
      peer.signalingMessageCallback(message);
    };

    // 房间创建成功后 打开数据通道 等待连接
    const onCreatedRoom = (roomId) => {
      peer.connectPeer(roomId, false);
      roomId.value = roomId;
      isWaiting.value = true;
    };

    onMounted(() => {
      peer.on("onChannelOpen", onChannelOpen);
      eventBus.on("onCreatedRoom", onCreatedRoom);
      eventBus.on("onSignalingMessage", onSignalingMessage);
    });

    return { createRoom, isWaiting };
  },
};
</script>