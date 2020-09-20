<script>
import { computed, onMounted, ref, watch } from "vue";
import renderSize from "../utils/FormatBytes";

export default {
  props: ["files"],
  setup(props, { emit }) {
    const showActions = ref(false);
    const fmtFiles = computed(() => {
      for (let i = 0; i < props.files.length; i++) {
        props.files[i].fmtSize = renderSize(props.files[i].size);
      }
      return props.files;
    });

    const onMouseEnter = () => {
      showActions.value = true;
    };

    const onMouseLeave = () => {
      showActions.value = false;
    };

    const onDownloadFile = (id) => {
      emit("onDownloadFile", id);
    };

    return { fmtFiles, onDownloadFile, showActions, onMouseEnter, onMouseLeave };
  },
};
</script>
<template>
  <div class="uploader-list">
    <ul class="container" id="uploaderList">
      <li
        v-for="file in fmtFiles "
        :key="file.id"
        class="file-list"
        @mouseenter="onMouseEnter()"
        @mouseleave="onMouseLeave()"
      >
        <div class="process" :style="{ width: file.precent + '%' }"></div>
        <div class="info">
          <div class="file-name" :title="file.name">
            <span class="name-text">{{file.name}}</span>
          </div>
          <div class="file-status" v-if="!showActions">
            <span class="prepare" v-if="file.status==='prepare'">等待传输…</span>
            <span class="transfering" v-if="file.status==='transfering'">
              <em class="precent">{{file.precent}}%</em>
            </span>
            <span class="error" v-if="file.status==='error'">传输错误</span>
            <span class="pause" v-if="file.status==='pause'">已暂停</span>
            <span class="cancel" v-if="file.status==='cancel'">已取消</span>
            <span class="success" v-if="file.status==='success'">传输成功</span>
          </div>
          <div class="file-size" v-if="!showActions">{{file.fmtSize}}</div>
          <div class="file-operate" v-if="showActions">
            <span class="operate-remove" @click="onDownloadFile(file.id)">下载</span>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>
<style scoped>
.uploader-list {
  position: relative;
  overflow: hidden;
  overflow-y: auto;
  height: 349px;
  margin-top: -1px;
  *z-index: 0;
  font-size: 12px;
}

.uploader-list .container {
  list-style: none;
  color: #424e67;
  position: relative;
  overflow: hidden;
  margin: 0 8px;
  padding: 8px 0;
}

.file-list {
  position: relative;
  height: 49px;
  border-bottom: 1px solid #f2f6fd;
  line-height: 49px;
}
.file-list:hover {
    background: #f1f1f1;
}
.file-list .process {
  position: absolute;
  z-index: 0;
  height: 100%;
  *height: 49px;
  background: #e2eeff;
}
.file-list .info {
  display: flex;
  justify-content: space-between;
  padding: 0 8px;
}
.file-list .file-status {
  overflow: hidden;
  text-overflow: ellipsis;
  position: relative;
  float: left;
  width: 200px;
  height: 49px;
}
.file-name {
  display: flex;
  position: relative;
  overflow: hidden;
  width: 150px;
  height: 49px;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.file-name .name-text {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.file-size {
  display: flex;
  justify-content: flex-end;
  width: 150px;
  height: 49px;
}
</style>