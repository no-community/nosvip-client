<style scoped>
.add-box {
    position: relative;
    margin: 0 auto;
    margin-top: 88px;
    width: 100px;
    height: 100px;
}
.add-icon::before {
  content: "";
  position: absolute;
  left: 50%;
  top: 50%;
  width: 55px;
  margin-left: -25px;
  border-top: 5px solid;
}
.add-icon::after {
  content: "";
  position: absolute;
  left: 50%;
  top: 50%;
  height: 55px;
  margin-top: -25px;
  border-left: 5px solid;
}
</style>
<script>
export default {
  setup(props,context) {
    const onSelectFiles = (files) => {
      context.emit("onSelectFiles", files);
    };

    const onChoseFile = () => {
      document.getElementById("choseFile").click();
    };

    return { onSelectFiles, onChoseFile };
  },
};
</script>
<template>
<div class="add-box" @click="onChoseFile">
  <div class="add-icon">
    <input
      type="file"
      multiple
      id="choseFile"
      style="visibility:hidden;position:absolute;top:0px;width:0px"
      @change="onSelectFiles($event.target.files)"
    />
  </div>
</div>  
</template>