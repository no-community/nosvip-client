<template>
  <div class="container" :class="{send: isSendFile, receive: !isSendFile}">
    <div class="card">
      <div class="card-header">
        <div class="card-title">{{title}}</div>
        <div class="card-action__switch" @click="changeType()">切换</div>
      </div>
      <div class="card-content" v-if="isSendFile">
        <EmptyFileList v-if="sendFileList.length==0" @onSelectFiles="onSelectFiles" />
        <SendFileList v-else :files="sendFileList" @onRemoveFile="onRemoveFile" />
      </div>
      <div class="card-content" v-else>
        <ReceiveFileList :files="receiveFileList" @onDownloadFile="onDownloadFile" />
      </div>
      <div class="card-footer" v-if="sendFileList.length > 0 && isSendFile">
        <input
          type="file"
          multiple
          name="uploadFile"
          id="uploadFile"
          class="uploadFile"
          style="visibility:hidden;position:absolute;top:0px;width:0px"
          @change="onSelectFiles($event.target.files)"
        />
        <div class="card-action__add" @click="onChoseFile">添加文件</div>
        <div class="card-text">{{sendFileList.length}} 个文件,共 {{sendFileTotalSize}}</div>
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
    const isSendFile = ref(true);
    const receivingFileId = ref(0);
    const receivingBuffer = ref([]);

    const title = computed(() => {
      return isSendFile.value ? "发送文件" : "接收文件";
    });

    // 计算属性实时计算发送文件大小
    const sendFileTotalSize = computed(() => {
      let totalSize = 0;
      for (let item of sendFileList.value) {
        totalSize = item.size + totalSize;
      }
      return renderSize(totalSize);
    });

    const receivingBufferSize = computed(() => {
      let totalSize = 0;
      for (let item of receivingBuffer.value) {
        totalSize += item.byteLength;
      }
      return totalSize;
    });

    // 切换状态
    const changeType = () => {
      isSendFile.value = !isSendFile.value;
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
          selectedFiles.value.splice(index, 1);
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
      let targetFile = selectedFiles.value.find((f) => f.id == id);
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

        sendFile.precent = 100.0;
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
        target.precent = 100.0;
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
        let targetFile = receiveFileList.value.find(
          (f) => f.id == receivingFileId.value
        );
        receivingBuffer.value.push(data);
        targetFile.precent = (
          (receivingBufferSize.value / targetFile.size) *
          100
        ).toFixed(2);
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
      title,
      sendFileList,
      sendFileTotalSize,
      receiveFileList,
      isSendFile,
      changeType,
      onSelectFiles,
      onChoseFile,
      onRemoveFile,
      onDownloadFile,
    };
  },
};
</script>
<style scoped>
.container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
} 
.send {
  background-color: #9896f1;
}
.receive {
  background-color: #d59bf6;
}
.card {
  width: 380px;
  box-shadow: 0 2px 1px -1px rgba(0,0,0,.2), 0 1px 1px 0 rgba(0,0,0,.14), 0 1px 3px 0 rgba(0,0,0,.12);
  transition: box-shadow 280ms cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 4px;
  margin: 0px auto;
  padding: 16px;
  background:#fff;
}
.card-header {
  position: relative;
}
.card-title {
  text-align: center;
  font-weight: 700;
  color: #111;
}
.card-action__switch {
  position: absolute;
  top: 0;
  right: 0;
  cursor: pointer;
  color: #667d99;
}
.card-action__add {
  cursor: pointer;
  color: #667d99;
}
.card-content {
  min-height: 275px;
  margin: 16px 0;
  border: 2px dashed #d1d1d1;
}
.card-footer {
  display: flex;
  justify-content: space-between;
}
.card-text {
  font-size: 14px;
  color: #c9d6df;
}
</style>