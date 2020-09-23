<template>
  <div class="container">
    <div class="main">
      <button
        :class="{ 'red-btn': !isWaiting, 'green-btn': isWaiting }"
        @click="createRoom"
      >
        {{ title }}
      </button>
      <div class="templink" v-if="isWaiting">
        <div class="tips">
          <p>{{ tips }}</p>
        </div>
        <div class="urls">
          <div class="long-link">
            <input readonly type="text" :value="templink" />
          </div>
        </div>
        <div class="qr">
          <vue-qrcode :value="templink" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import socket from "../utils/WebSocketManager";
import eventBus from "../utils/EventBus";
import peer from "../utils/Peer";
import VueQrcode from "vue3-qrcode";

export default {
  components: {
    VueQrcode,
  },
  setup() {
    const router = useRouter();
    const roomId = ref(0);
    const title = ref("开始");
    const tips = ref("分享下方链接或二维码到需要链接的浏览器");
    const templink = ref("");
    const isWaiting = ref(false);

    const createRoom = async () => {
      try {
        await socket.invoke("CreateRoom");
      } catch (error) {
        console.error(error.toString());
      }
    };

    const onChannelOpen = () => {
      title.value = "连接成功...";
      isWaiting.value = false;
      router.push(`/r/${roomId.value}`);
    };

    // 信令服务器交换信息
    const onSignalingMessage = (message) => {
      peer.signalingMessageCallback(message);
    };

    // 房间创建成功后 打开数据通道 等待连接
    const onCreatedRoom = (rid) => {
      console;
      roomId.value = rid;
      isWaiting.value = true;
      title.value = "等待连接...";
      templink.value =
        window.location.protocol +
        "//" +
        window.location.host +
        "/#/r/" +
        rid +
        "/join";
      peer.connectPeer(rid, false);
    };

    onMounted(async () => {
      eventBus.on("onCreatedRoom", onCreatedRoom);
      eventBus.on("onSignalingMessage", onSignalingMessage);
      peer.on("onChannelOpen", onChannelOpen);
      await socket.start();
    });

    return { createRoom, isWaiting, title, tips, templink };
  },
};
</script>
<style scoped>
.container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #b9d8c9;
}
.main {
  width: 100%;
  /* display: flex; */
}

.red-btn {
  width: 300px;
  padding: 24px;
  background: #cf5d5d;
  border: 0;
  border-bottom: 5px solid #964a4a;
  border-radius: 10px;
  color: #fff;
  font-family: "Oldenburg";
  font-size: 30px;
  text-decoration: none;
  cursor: default;
}
.green-btn {
  width: 300px;
  padding: 24px;
  border: 0;
  border-bottom: 5px solid #4b906d;
  border-radius: 10px;
  color: #fff;
  font-family: "Oldenburg";
  font-size: 30px;
  text-decoration: none;
  cursor: default;
  background: #4ab67f;
}
.templink {
  display: flex;
  margin: 16px auto;
  flex-direction: column;
}
.qr {
  flex: none;
  margin: 16px 0;
}
.urls {
}
input {
  background: #f9f2e7;
  color: #333;
  border: 0;
  margin: 0;
  font: 18px/1 monospace;
  padding: 16px;
  text-align: center;
  width: 40%;
}

.tips {
  display: inline-block;
  padding: 15px 20px;
  color: #fff;
  border-radius: 10px;
  text-align: center;
  white-space: normal;
}
</style>