<template>
  <div>
    <input type="file" name="uploadFile" id="uploadFile"
      style="visibility:hidden;position:absolute;top:0px;width:0px" />
    <!--隐藏默认标签样式-->
    <div class='choseFileBtn flex flexAC' @click='choseFile'>
      <img src="../assets/upload.png">
      选择文件
    </div>


  </div>
  <button @click="createRoom">文件已选好</button>
  <ol>
    <li v-for="(file,index) in receiveFileList" :key="index">{{ file }}</li>
  </ol>
</template>

<script>
  import {
    onMounted,
    ref
  } from "vue";
  import {
    useRouter
  } from "vue-router";
  import socket from "../utils/WebSocketManager";
  import eventBus from "../utils/EventBus";
  import {
    Peer
  } from "../utils/Peer";
  import $ from 'jquery'
  export default {
    setup() {
      const router = useRouter();
      const sendFileList = ref([]);
      const receiveFileList = ref([]);
      const peer = new Peer();

      const createRoom = () => {
        debugger
        socket.invoke("CreateRoom").catch(function (err) {
          return console.error(err.toString());
        });
      };
      const choseFile = () => {
        debugger
        $('#uploadFile').click();
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

      return {
        createRoom,
        receiveFileList,
        choseFile
      };
    },
  };
</script>
<style scoped>
  .flex {
    display: flex
  }
  .flexAC{
    align-items: center;
    justify-content: center
  }
  .choseFileBtn {
    border: 1px solid #d9d9d9;
    border-radius: 4px;
  }
  .choseFileBtn img {
    width: 40px;
    height: 40rpx;
  }
</style>