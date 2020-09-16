<template>
  <!-- 框 -->
  <div class="flex flexAC" :class="[isSendStatus?'SSB':'RSB']" style="height:100vh">
    <div class="allBox flex_column">
      <!-- 状态控制器 -->
      <div class="statusBox flex_column">
        <div class='SSClass' @click='changeType()'>发送端</div>
        <div class='RSClass' @click='changeType()' style="margin-top:10px">接收端</div>
      </div>
      <!-- 文件显示框 -->
      <div class="fileBox flex flexAC">
        <div v-if='receiveFileList.length==0' class="flex_column flexAC">
          <input type="file" multiple name="uploadFile" id="uploadFile" class="uploadFile"
            style="visibility:hidden;position:absolute;top:0px;width:0px" @change="onFileListChange($event)" />
          <!-- <div @click='choseFile' class="choseFileBtn">上传文件</div> -->
          <img src="../assets/uoload.png" @click='choseFile' style="width: 40%" />
          <span :class="[isSendStatus?'SSCO':'RSCO']">点击上方按钮进行上传</span>
        </div>
       
        <div v-else class="flex_column" style="width: 100%">
          <div v-for='(item,i) in receiveFileList' class="fileItemBox">
           <div class='flex flexIC' style="padding:5px 0"> 
              <img src="../assets/file.png" style="width:15px;"/>
              <text style="margin-left:5px;color:#1890ff">{{item.name}}</text>
               <img style="margin-left:auto;width:15px;height: 15px;" src="../assets/delect.png" @click='onDelFileItem(item)' />
          </div>
          </div>
        
      </div>
      </div>
      <div class="fileRemark flex" style="width: 100%" v-if='receiveFileList.length>0'>
        <!-- background: #555ab2 -->
        <input type="file" multiple name="uploadFile" id="uploadFile" class="uploadFile"
        style="visibility:hidden;position:absolute;top:0px;width:0px" @change="onFileListChange($event)" />
        <div style="font-weight: bold;margin-left: 20px" :class="[isSendStatus?'SSCO':'RSCO']" @click='choseFile'>添加文件</div>
        <div style="margin-left:auto;margin-right: 20px" :class="[isSendStatus?'SSCO':'RSCO']">
          {{receiveFileList.length}}个文件,共{{filsListSize}}b
        </div>
      </div>
      <div style="width:100%" class="flex flexAC">
      <div class="sendBtn" :class="[isSendStatus?'SSC':'RSC']">
        点击发送
      </div>
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
  import peer from "../utils/Peer";
  import $ from 'jquery'
  // import uuidv4 from 'uuid/v4';

  export default {
    setup() {
      const router = useRouter();
      const uid = ref(0); //记录图片的唯一性
      const filsListSize = ref(0) //选取文件的大小
      const sendFileList = ref([]);
      const receiveFileList = ref([]);
      const isSendStatus = ref(true); //是否是发送端和接收端 true是发送端 false是接收端
      const receivingFileId = ref(0);
      const receivingBuffer = ref([]);

      const createRoom = async () => {
        try {
          await socket.invoke("CreateRoom")
        } catch (error) {
          console.error(err.toString());
        }
      };
      // 读取文件大小
      const onReadFileListSize = () => {
         let allSize = 0
         for(let item of receiveFileList.value){
            allSize = item.size + allSize
         }
         filsListSize.value = allSize
      };
      // 文件读取是发生改变
      const onFileListChange = (e) => {
        for (let item of event.target.files) {
          item.id = uid.value
          item.status = 'noSub' // 定义一个status为刚选取文件没上传的状态
          receiveFileList.value.push(item)
          uid.value++
        }
        onReadFileListSize()
        console.log(event.target.files, '文件对象')
        // receiveFileList.value.push(...event.target.files)
        console.log(receiveFileList.value,'文件数据')
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
      const choseFile = () => {
        $(".uploadFile").click()
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
      // 切换状态
      const changeType = () => {
        isSendStatus.value = !isSendStatus.value;
      };
      // 删除文件
      const onDelFileItem = (fileItem) => {
          for(let index in receiveFileList.value){
            if(fileItem.id == receiveFileList.value[index].id){
              receiveFileList.value.splice(index,1)
              onReadFileListSize()
              return
            }
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

      onMounted(async () => {
        await socket.start();
        $('.uploadFile').change(function (e) {
          var file = $('.uploadFile').val();
          console.log(file, '上传的文件')
        })
        eventBus.on("onCreatedRoom", onCreatedRoom);
        eventBus.on("onSignalingMessage", onSignalingMessage);
        peer.on("onReceiveMessage", onReceiveMessage);
      });

      return {
        createRoom,
        receiveFileList,
        isSendStatus,
        changeType,
        choseFile,
        onDelFileItem,
        onFileListChange,
        uid,
        filsListSize
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
  .flexIC{
    align-items: center
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
    /* background: #555ab2; */
    /* background: #3fcfce; */
    margin: 20px
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
    color: white
  }

  .SSB {
    background: linear-gradient(#bddee1, #f0fcfd)
  }

  .SSC {
    background: #52d4d3;
  }

  .SSCO {
    color: #52d4d3
  }

  .RSClass {
    width: 60px;
    height: 30px;
    line-height: 30px;
    text-align: center;
    background: #555ab2;
    ;
    border-radius: 0px 15px 15px 0;
    color: white
  }

  .RSB {
    background: linear-gradient(#555ab2, #a690ff)
  }

  .RSC {
    background: #555ab2;
  }

  .RSCO {
    color: #555ab2
  }
  .fileItemBox{
    margin:5px 10px;
    padding: 10px 5px;
  }
  .fileItemBox :hover{
    background: #E2f6ff
  }
</style>