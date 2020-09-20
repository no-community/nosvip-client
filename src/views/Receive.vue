<template>
  <!-- 框 -->
  <div class="flex flexAC" :class="[isSendStatus?'SSB':'RSB']" style="height:100vh">
    <div class="allBox flex_column">
      <!-- 状态控制器 -->
      <div class="statusBox flex_column">
        <div class="SSClass" :class="{ active: isSendStatus }" @click="changeType()">发送端</div>
        <div
          class="RSClass"
          :class="{ active: !isSendStatus }"
          @click="changeType()"
          style="margin-top:10px"
        >接收端</div>
      </div>
      <!-- 文件显示框 -->
      <div class="fileBox flexAC" v-if="isSendStatus">
        <div v-if="sendFileList.length==0" class="flex_column flexAC">
          <EmptyFileList @onSelectFiles="onSelectFiles" />
        </div>
        <div v-else class="flex_column">
          <SendFileList :files="sendFileList" @onRemoveFile="onRemoveFile" />
        </div>
      </div>
      <div class="fileRemark flex" style="width: 100%" v-if="sendFileList.length>0 && isSendStatus">
        <!-- background: #555ab2 -->
        <input
          type="file"
          multiple
          name="uploadFile"
          id="uploadFile"
          class="uploadFile"
          style="visibility:hidden;position:absolute;top:0px;width:0px"
          @change="onSelectFiles($event.target.files)"
        />
        <div
          style="font-weight: bold;margin-left: 20px"
          :class="[isSendStatus?'SSCO':'RSCO']"
          @click="onChoseFile"
        >添加文件</div>
        <div
          style="margin-left:auto;margin-right: 20px"
          :class="[isSendStatus?'SSCO':'RSCO']"
        >{{sendFileList.length}}个文件,共{{sendFileTotalSize}}</div>
      </div>
      <div class="fileBox flexAC" v-if="!isSendStatus">
        <div class="flex_column">
          <ReceiveFileList :files="receiveFileList" @onDownloadFile="onDownloadFile" />
        </div>
      </div>
      <!-- <div style="width:100%" class="flex flexAC">
        <div class="sendBtn" :class="[isSendStatus?'SSC':'RSC']">创建链接</div>
      </div>-->
    </div>
  </div>
</template>

<script>
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import socket from "../utils/WebSocketManager";
import eventBus from "../utils/EventBus";
import peer from "../utils/Peer";
import FileChunker from "../utils/FileChunker";
import TransferFile from "../utils/TransferFile";
import renderSize from "../utils/FormatBytes";
import EmptyFileList from "../components/EmptyFileList.vue";
import SendFileList from "../components/SendFileList.vue";
import ReceiveFileList from "../components/ReceiveFileList.vue";

export default {
  components: {
    EmptyFileList,
    SendFileList,
    ReceiveFileList,
  },
  emits: ["onSelectFiles", "onRemoveFile", "onDownloadFile"],
  setup() {
    const route = useRoute();
    const roomId = computed(() => route.params.rid);

    const uid = ref(1);
    const selectedFiles = ref([]);
    const sendFileList = ref([]);
    const receiveFileList = ref([]);
    const isSendStatus = ref(true);
    const receivingFileId = ref(0);
    const receivingBuffer = ref([]);

    // 计算属性实时计算发送文件大小
    const sendFileTotalSize = computed(() => {
      let totalSize = 0;
      for (let item of sendFileList.value) {
        totalSize = item.size + totalSize;
      }
      return renderSize(totalSize);
    });

    const receivingBufferSize = computed(()=> {
      let totalSize =0;
      for ( let item of receivingBuffer.value) {
        totalSize+=item.byteLength;
      }
      return totalSize;
    })

    // 切换状态
    const changeType = () => {
      isSendStatus.value = !isSendStatus.value;
    };

    // 文件读取是发生改变
    const onSelectFiles = async (files) => {
      for (let item of files) {
        item.id = uid.value;
        item.precent = 0;
        item.status = "prepare";
        uid.value++;
        const transferFile = new TransferFile(item);
        selectedFiles.value.push(item);
        sendFileList.value.push(transferFile);
        await sendFileChangeMessage("AddFile", transferFile);
      }
    };

    // 打开文件选择
    const onChoseFile = () => {
      document.getElementById("uploadFile").click();
    };

    // 移除文件
    const onRemoveFile = async (id) => {
      for (let index in sendFileList.value) {
        if (id == sendFileList.value[index].id) {
          sendFileList.value.splice(index, 1);
          selectedFiles.value.splice(index,1);
          await sendFileChangeMessage("DeleteFile", { id: id });
        }
      }
    };

    // 文件下载
    const onDownloadFile = async (id) => {
      await peer.sendJson({
        type: "DownloadFile",
        payload: { id: id },
      });
    };

    // 发送文件
    const sendFile = async (id) => {
      let targetFile = selectedFiles.value.find((f)=>f.id==id);
      let sendFile = sendFileList.value.find((f) => f.id == id);
      const chunker = new FileChunker(targetFile);
      await peer.sendJson({
        type: "TransferFileStart",
        payload: {
          id: id,
        },
      });
      sendFile.status = "transfering";

      let done = false;
      while (!done) {
        const result = await chunker.getNextChunk();
        done = result.done;
        const { chunk, offset } = result;
        try {
          await peer.send(chunk);
          sendFile.precent = ((offset / sendFile.size) * 100).toFixed(2);
        } catch (err) {
          console.log("传输错误：" + err);
          break;
        }
      }

      if (done) {
        await peer.sendJson({
          type: "TransferFileEnd",
          payload: {
            id: id,
          },
        });
        
        sendFile.precent = 100.00;
        sendFile.status = "success";
      }
    };

    // 发送文件变化消息
    const sendFileChangeMessage = async (type, payload) => {
      await peer.sendJson({
        type: type,
        payload: payload,
      });
    };

    const handleMessage = async (msgText) => {
      const message = JSON.parse(msgText);
      if (message.type === "TransferFileStart") {
        let target = receiveFileList.value.find(
          (r) => r.id == message.payload.id
        );
        receivingFileId.value = message.payload.id;
        target.status = "transfering";
      } else if (message.type == "DownloadFile") {
        await sendFile(message.payload.id);
      } else if (message.type === "TransferFileEnd") {
        let target = receiveFileList.value.find(
          (r) => r.id == message.payload.id
        );
        target.status = "success";
        target.precent = 100.00;
        const blob = new Blob(receivingBuffer.value);

        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(blob);
        link.download = target.name;
        link.click();
        window.URL.revokeObjectURL(link.href);
      } else if (message.type === "AddFile") {
        receiveFileList.value.push(message.payload);
      } else if (message.type === "DeleteFile") {
        receiveFileList.value = receiveFileList.value.filter(
          (r) => r.id != message.payload.id
        );
      }
    };

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

    const onReceiveMessage = async (data) => {
      if (typeof data == "string") {
        await handleMessage(data);
      } else {
        let targetFile = receiveFileList.value.find(f=>f.id==receivingFileId.value);
        receivingBuffer.value.push(data);
        targetFile.precent = ((receivingBufferSize.value/targetFile.size) *100).toFixed(2);
      }
    };

    onMounted(async () => {
      await socket.start();
      eventBus.on("onJoinedRoom", onJoinedRoom);
      eventBus.on("onSignalingMessage", onSignalingMessage);
      await joinRoom(roomId.value);

      peer.on("onReceiveMessage", onReceiveMessage);
    });

    return {
      roomId,
      sendFileList,
      sendFileTotalSize,
      receiveFileList,
      isSendStatus,
      changeType,
      onSelectFiles,
      onChoseFile,
      onRemoveFile,
      onDownloadFile
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
  width: 60px;
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

.active {
  width: 100px !important;
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