<template>
  <!-- 框 -->
  <div class="flex flexAC" :class="[isSendStatus?'SSB':'RSB']" style="height:100vh">
    <div class="allBox flex_column">
      <!-- 状态控制器 -->
      <div class="statusBox flex_column">
        <div class="SSClass" @click="changeType()">发送端</div>
        <div class="RSClass" @click="changeType()" style="margin-top:10px">接收端</div>
      </div>
      <!-- 文件显示框 -->
      <div class="fileBox flex flexAC">
        <div v-if="sendFileList.length==0" class="flex_column flexAC">
          <input
            type="file"
            multiple
            name="uploadFile"
            id="uploadFile"
            class="uploadFile"
            style="visibility:hidden;position:absolute;top:0px;width:0px"
            @change="onFileListChange($event)"
          />
          <!-- <div @click='choseFile' class="choseFileBtn">上传文件</div> -->
          <img src="../assets/uoload.png" @click="choseFile" style="width: 40%" />
          <span :class="[isSendStatus?'SSCO':'RSCO']">点击上方按钮进行上传</span>
        </div>

        <div v-else class="flex_column" style="width: 100%">
          <div v-for="(item,i) in sendFileList" class="fileItemBox">
            <div class="flex flexIC" style="padding:5px 0">
              <img src="../assets/file.png" style="width:15px;" />
              <text style="margin-left:5px;color:#1890ff">{{item.name}}</text>
              <img
                style="margin-left:auto;width:15px;height: 15px;"
                src="../assets/delect.png"
                @click="onDelFileItem(item)"
              />
            </div>
          </div>
        </div>
      </div>
      <div class="fileRemark flex" style="width: 100%" v-if="sendFileList.length>0">
        <!-- background: #555ab2 -->
        <input
          type="file"
          multiple
          name="uploadFile"
          id="uploadFile"
          class="uploadFile"
          style="visibility:hidden;position:absolute;top:0px;width:0px"
          @change="onFileListChange($event)"
        />
        <div
          style="font-weight: bold;margin-left: 20px"
          :class="[isSendStatus?'SSCO':'RSCO']"
          @click="choseFile"
        >添加文件</div>
        <div
          style="margin-left:auto;margin-right: 20px"
          :class="[isSendStatus?'SSCO':'RSCO']"
        >{{sendFileList.length}}个文件,共{{filsListSize}}b</div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import socket from "../utils/WebSocketManager";
import eventBus from "../utils/EventBus";
import peer from "../utils/Peer";
import FileChunker  from "../utils/FileChunker";
import $ from "jquery";

export default {
  setup() {
    const route = useRoute();
    const roomId = computed(() => route.params.rid);

    const uid = ref(1);
    const filsListSize = ref(0);
    const sendFileList = ref([]);
    const receiveFileList = ref([]);
    const isSendStatus = ref(true);
    const receivingFileId = ref(0);
    const receivingBuffer = ref([]);

    const joinRoom = async (roomId) => {
      try {
        await socket.invoke("JoinRoom", roomId);
      } catch (error) {
        console.error(error.toString());
      }
    };

    const onJoinedRoom = (roomId) => {
      console.log("开始链接....");
      peer.connectPeer(roomId, true);
    };

    const onSignalingMessage = (message) => {
      peer.signalingMessageCallback(message);
    };

    // 发送文件
    const sendFile = async (id) => {
      const chunker = new FileChunker(sendFileList.value.find(f=>f.id==id));
      console.log("开始传输文件...");
      await peer.sendJson({
        type: "TransferFileStart",
        payload: {
          id: id
        }
      });
      let done = false;
      while (!done) {
        const result = await chunker.getNextChunk();
        done = result.done;
        const { chunk, offset } = result;
        try {
          await peer.send(chunk);
        } catch (err) {
          console.log("传输错误：" + err);
          break;
        }
      }

      console.log("传输文件完成...");
      if (done) {
        await peer.sendJson({
          type: "TransferFileEnd",
          payload: {
            id: id
          }
        });
      }
    };

    // 发送文件变化消息
    const sendFileChangeMessage = async (type, payload) => {
      await peer.sendJson({
        type: type,
        payload: payload,
      });
    };

    // 读取文件大小
    const onReadFileListSize = () => {
      let allSize = 0;
      for (let item of sendFileList.value) {
        allSize = item.size + allSize;
      }
      filsListSize.value = allSize;
    };

    // 文件读取是发生改变
    const onFileListChange = (e) => {
      for (let item of event.target.files) {
        item.id = uid.value;
        item.status = "ready";
        sendFileList.value.push(item);
        uid.value++;
      }
      sendFileChangeMessage("AddFile", {
        id: e.target.files[0].id,
        status: e.target.files[0].status,
        name: e.target.files[0].name,
        size: e.target.files[0].size,
      });
      onReadFileListSize();
    };

    const onReceiveMessage = async (data) => {
      if (typeof data == "string") {
        console.log("接收到文本消息：", data);
        await handleMessage(data);
      } else {
        console.log("接收到流数据:", data);
        receivingBuffer.value.push(data);
      }
    };

    const choseFile = () => {
      $(".uploadFile").click();
    };

    const handleMessage = async (msgText) => {
      const message = JSON.parse(msgText);
      if (message.type === "DownloadFile") {
        await sendFile(message.payload.id);
      }
    };

    // 切换状态
    const changeType = () => {
      isSendStatus.value = !isSendStatus.value;
    };

    // 删除文件
    const onDelFileItem = (file) => {
      sendFileList.value = sendFileList.value.filter((f) => f.id != file.id);
      sendFileChangeMessage("DeleteFile", {
        id: file.id,
        status: file.status,
        name: file.name,
        size: file.size,
      });
      onReadFileListSize();
    };

    onMounted(async () => {
      await socket.start();
      eventBus.on("onJoinedRoom", onJoinedRoom);
      eventBus.on("onSignalingMessage", onSignalingMessage);
      await joinRoom(roomId.value);

      $(".uploadFile").change(function (e) {
        var file = $(".uploadFile").val();
        console.log(file, "上传的文件");
      });

      peer.on("onReceiveMessage", onReceiveMessage);
    });

    return {
      roomId,
      sendFileList,
      isSendStatus,
      changeType,
      choseFile,
      onDelFileItem,
      onFileListChange,
      uid,
      filsListSize,
    };
  },
};
</script>
<style scoped>
.flex {
  display: flex;
}

.flex_column {
  display: flex;
  flex-direction: column;
}
.flexIC {
  align-items: center;
}
.flexAC {
  align-items: center;
  justify-content: center;
}

.choseFileBtn {
  /* border: 1px solid #d9d9d9; */
  width: 30%;
  margin: 30px 0;
  border-radius: 4px;
  background: #52d4d3;
  /* background: linear-gradient(#bddee1, #f0fcfd); */
}

.choseFileBtn img {
  width: 40px;
  height: 40rpx;
}

.allBox {
  width: 30%;
  position: relative;
  background: white;
}

.fileBox {
  margin: 40px 20px 20px 20px;
  min-height: 400px;
  border: 2px dashed #d1d1d1;
}

.sendBtn {
  height: 40px;
  width: 400px;
  border-radius: 20px;
  line-height: 40px;
  text-align: center;
  color: white;
  /* background: #555ab2; */
  /* background: #3fcfce; */
  margin: 20px;
}

.statusBox {
  position: absolute;

  top: 10px;
  right: -100px;
}

.SSClass {
  width: 100px;
  height: 30px;
  line-height: 30px;
  text-align: center;
  background: #3fcfce;
  border-radius: 0px 15px 15px 0;
  color: white;
}

.SSB {
  background: linear-gradient(#bddee1, #f0fcfd);
}

.SSC {
  background: #52d4d3;
}

.SSCO {
  color: #52d4d3;
}

.RSClass {
  width: 60px;
  height: 30px;
  line-height: 30px;
  text-align: center;
  background: #555ab2;
  border-radius: 0px 15px 15px 0;
  color: white;
}

.RSB {
  background: linear-gradient(#555ab2, #a690ff);
}

.RSC {
  background: #555ab2;
}

.RSCO {
  color: #555ab2;
}
.fileItemBox {
  margin: 5px 10px;
  padding: 10px 5px;
}
.fileItemBox :hover {
  background: #e2f6ff;
}
</style>