let e=document.createElement("style");e.innerHTML=".container[data-v-109fa019]{height:100vh;display:flex;justify-content:center;align-items:center}.send[data-v-109fa019]{background-color:#9896f1}.receive[data-v-109fa019]{background-color:#d59bf6}.card[data-v-109fa019]{width:380px;box-shadow:0 2px 1px -1px rgba(0,0,0,.2),0 1px 1px 0 rgba(0,0,0,.14),0 1px 3px 0 rgba(0,0,0,.12);transition:box-shadow 280ms cubic-bezier(.4,0,.2,1);border-radius:4px;margin:0 auto;padding:16px;background:#fff}.card-header[data-v-109fa019]{position:relative}.card-title[data-v-109fa019]{text-align:center;font-weight:700;color:#111}.card-action__switch[data-v-109fa019]{position:absolute;top:0;right:0;cursor:pointer;color:#667d99}.card-action__add[data-v-109fa019]{cursor:pointer;color:#667d99}.card-content[data-v-109fa019]{min-height:275px;margin:16px 0;border:2px dashed #d1d1d1}.card-footer[data-v-109fa019]{display:flex;justify-content:space-between}.card-text[data-v-109fa019]{font-size:14px;color:#c9d6df}",document.head.appendChild(e);import{f as a,r as i,o as t,i as n,g as l,c as s,a as o,t as d,b as c,w as r,d as p,p as u,e as v}from"./index.d3ea83d3.js";import{s as f,e as F,p as y}from"./Peer.36491284.js";import{s as g,a as h,b as w,T as m,r as x,F as b}from"./ReceiveFileList.15979290.js";var L={components:{EmptyFileList:g,SendFileList:h,ReceiveFileList:w},emits:["onSelectFiles","onRemoveFile","onDownloadFile"],setup(){const e=n(),l=a(()=>e.params.rid),s=i(1),o=i([]),d=i([]),c=i([]),r=i(!0),p=i(0),u=i([]),v=a(()=>r.value?"发送文件":"接收文件"),g=a(()=>{let e=0;for(let a of d.value)e=a.size+e;return x(e)}),h=a(()=>{let e=0;for(let a of u.value)e+=a.byteLength;return e}),w=async(e,a)=>{await y.sendJson({type:e,payload:a})},L=async e=>{const a=JSON.parse(e);if("TransferFileStart"===a.type){let e=c.value.find(e=>e.id==a.payload.id);p.value=a.payload.id,e.status="transfering"}else if("DownloadFile"==a.type)await(async e=>{let a=o.value.find(a=>a.id==e),i=d.value.find(a=>a.id==e);const t=new b(a);await y.sendJson({type:"TransferFileStart",payload:{id:e}}),i.status="transfering";let n=!1;for(;!n;){const e=await t.getNextChunk();n=e.done;const{chunk:a,offset:l}=e;try{await y.send(a),i.precent=(l/i.size*100).toFixed(2)}catch(e){console.log("传输错误："+e);break}}n&&(await y.sendJson({type:"TransferFileEnd",payload:{id:e}}),i.precent=100,i.status="success")})(a.payload.id);else if("TransferFileEnd"===a.type){let e=c.value.find(e=>e.id==a.payload.id);e.status="success",e.precent=100;const i=new Blob(u.value),t=document.createElement("a");t.href=window.URL.createObjectURL(i),t.download=e.name,t.click(),window.URL.revokeObjectURL(t.href)}else"AddFile"===a.type?c.value.push(a.payload):"DeleteFile"===a.type&&(c.value=c.value.filter(e=>e.id!=a.payload.id))},S=e=>{console.log("开始链接...."),y.connectPeer(e,!0)},k=e=>{y.signalingMessageCallback(e)},R=async e=>{if("string"==typeof e)await L(e);else{let a=c.value.find(e=>e.id==p.value);u.value.push(e),a.precent=(h.value/a.size*100).toFixed(2)}};return t(async()=>{await f.start(),F.on("onJoinedRoom",S),F.on("onSignalingMessage",k),await(async e=>{try{await f.invoke("JoinRoom",e)}catch(e){console.error(e.toString())}})(l.value),y.on("onReceiveMessage",R)}),{title:v,sendFileList:d,sendFileTotalSize:g,receiveFileList:c,isSendFile:r,changeType:()=>{r.value=!r.value},onSelectFiles:async e=>{for(let a of e){a.id=s.value,a.precent=0,a.status="prepare",s.value++;const e=new m(a);o.value.push(a),d.value.push(e),await w("AddFile",e)}},onChoseFile:()=>{document.getElementById("uploadFile").click()},onRemoveFile:async e=>{for(let a in d.value)e==d.value[a].id&&(d.value.splice(a,1),o.value.splice(a,1),await w("DeleteFile",{id:e}))},onDownloadFile:async e=>{await y.sendJson({type:"DownloadFile",payload:{id:e}})}}}};const S=r("data-v-109fa019");u("data-v-109fa019");const k={class:"card"},R={class:"card-header"},_={class:"card-title"},T={key:0,class:"card-content"},D={key:1,class:"card-content"},O={key:2,class:"card-footer"},C={class:"card-text"};v();const j=S((function(e,a,i,t,n,r){const u=l("EmptyFileList"),v=l("SendFileList"),f=l("ReceiveFileList");return p(),s("div",{class:["container",{send:t.isSendFile,receive:!t.isSendFile}]},[o("div",k,[o("div",R,[o("div",_,d(t.title),1),o("div",{class:"card-action__switch",onClick:a[1]||(a[1]=e=>t.changeType())},"切换")]),t.isSendFile?(p(),s("div",T,[0==t.sendFileList.length?o(u,{key:0,onOnSelectFiles:t.onSelectFiles},null,8,["onOnSelectFiles"]):o(v,{key:1,files:t.sendFileList,onOnRemoveFile:t.onRemoveFile},null,8,["files","onOnRemoveFile"])])):(p(),s("div",D,[o(f,{files:t.receiveFileList,onOnDownloadFile:t.onDownloadFile},null,8,["files","onOnDownloadFile"])])),t.sendFileList.length>0&&t.isSendFile?(p(),s("div",O,[o("input",{type:"file",multiple:"",name:"uploadFile",id:"uploadFile",class:"uploadFile",style:{visibility:"hidden",position:"absolute",top:"0px",width:"0px"},onChange:a[2]||(a[2]=e=>t.onSelectFiles(e.target.files))},null,32),o("div",{class:"card-action__add",onClick:a[3]||(a[3]=(...e)=>t.onChoseFile(...e))},"添加文件"),o("div",C,d(t.sendFileList.length)+" 个文件,共 "+d(t.sendFileTotalSize),1)])):c("v-if",!0)])],2)}));L.render=j,L.__scopeId="data-v-109fa019",L.__file="src/views/Receive.vue";export default L;
