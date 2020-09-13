<template>
  <!-- 框 -->
  <div class="flex flexAC" style="height:100vh">
    <div class="allBox flex_column flexAC">
      <!-- 状态控制器 -->
      <div class="statusBox flex_column">
        <div class='SSClass'>发送端</div>
        <div class='RSClass'>接收端</div>
      </div>

      <!-- 文件显示框 -->
      <div class="fileBox flex_column flexAC">
        <input type="file" name="uploadFile" id="uploadFile"
          style="visibility:hidden;position:absolute;top:0px;width:0px" />
        <!-- <div @click='choseFile' class="choseFileBtn">上传文件</div> -->
        <img src="../assets/uoload.png" @click='choseFile' style="width: 40%" />
        <span>点击上方按钮进行上传</span>
      </div>
      <div class="fileRemark flex">
          <!-- background: #555ab2 -->
        <div style="font-weight: bold;color:#555ab2;margin-left: 20px">添加文件</div>
        <div style="margin-left:auto;margin-right: 20px">
          1个文件,共158b
        </div>
      </div>
      <div class="sendBtn">
        点击发送
      </div>

    </div>
  </div>




  <!-- <div>
    <input type="file" name="uploadFile" id="uploadFile"
      style="visibility:hidden;position:absolute;top:0px;width:0px" />
  
    <div class='choseFileBtn flex flexAC' @click='choseFile'>
      <img src="../assets/upload.png">
      选择文件
    </div>
  </div> -->
  <!-- <button @click="createRoom">文件已选好</button>
  <ol>
    <li v-for="(file,index) in receiveFileList" :key="index">{{ file }}</li>
  </ol> -->
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
      const isSendStatus = 0; //判断你是接受端还是发送端 0是接受端 1是发送端 默认接受端
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
      // 选择文件的按钮
      const choseFile = () => {
        debugger
        $('#uploadFile').click();
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
        choseFile,
        isSendStatus
      };
    },
  };
</script>
<style scoped>
  .flex {
    display: flex
  }

  .flex_column {
    display: flex;
    flex-direction: column
  }

  .flexAC {
    align-items: center;
    justify-content: center
  }

  .choseFileBtn {
    /* border: 1px solid #d9d9d9; */
    width: 30%;
    margin: 30px 0;
    border-radius: 4px;
    background: #52d4d3
      /* background: linear-gradient(#bddee1, #f0fcfd); */
  }

  .choseFileBtn img {
    width: 40px;
    height: 40rpx;
  }

  .allBox {
    width: 30%;
    position: relative;
    background: white
  }

  .fileBox {
    margin: 40px 20px 20px 20px;
    min-height: 400px;
    border: 2px dashed #d1d1d1
  }

  .sendBtn {
    height: 40px;
    width: 400px;
    border-radius: 20px;
    line-height: 40px;
    text-align: center;
    color: white;
    background: #555ab2;
    /* background: #3fcfce; */
    margin: 20px
  }

  .statusBox {
    position: absolute;

    top: 10px;
    right: -100px;
  }
  .SSClass{
    width: 100px;
    height: 30px;
    line-height: 30px;
    text-align: center;
    background: #3fcfce;
    border-radius: 0px 15px  15px 0;
    color: white
  }
  .RSClass{
    margin-top: 10px;
    width: 60px;
    height: 30px;
    line-height: 30px;
    text-align: center;
    background: #555ab2;;
    border-radius: 0px 15px  15px 0;
    color: white
  }
</style>