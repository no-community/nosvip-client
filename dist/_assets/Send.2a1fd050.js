let e=document.createElement("style");e.innerHTML=".flex[data-v-2c3b027c]{display:flex}.flex_column[data-v-2c3b027c]{display:flex;flex-direction:column}.flexIC[data-v-2c3b027c]{align-items:center}.flexAC[data-v-2c3b027c]{align-items:center;justify-content:center}.choseFileBtn[data-v-2c3b027c]{width:30%;margin:30px 0;border-radius:4px;background:#52d4d3}.choseFileBtn img[data-v-2c3b027c]{width:40px;height:40rpx}.allBox[data-v-2c3b027c]{width:30%;position:relative;background:#fff}.fileBox[data-v-2c3b027c]{margin:40px 20px 20px;min-height:400px;border:2px dashed #d1d1d1}.sendBtn[data-v-2c3b027c]{height:40px;width:400px;border-radius:20px;line-height:40px;text-align:center;color:#fff;margin:20px}.statusBox[data-v-2c3b027c]{position:absolute;top:10px;right:-100px}.SSClass[data-v-2c3b027c]{width:60px;height:30px;line-height:30px;text-align:center;background:#3fcfce;border-radius:0 15px 15px 0;color:#fff}.SSB[data-v-2c3b027c]{background:linear-gradient(#bddee1,#f0fcfd)}.SSC[data-v-2c3b027c]{background:#52d4d3}.SSCO[data-v-2c3b027c]{color:#52d4d3}.RSClass[data-v-2c3b027c]{width:60px;height:30px;line-height:30px;text-align:center;background:#555ab2;border-radius:0 15px 15px 0;color:#fff}.active[data-v-2c3b027c]{width:100px!important}.RSB[data-v-2c3b027c]{background:linear-gradient(#555ab2,#a690ff)}.RSC[data-v-2c3b027c]{background:#555ab2}.RSCO[data-v-2c3b027c]{color:#555ab2}.fileItemBox[data-v-2c3b027c]{margin:5px 10px;padding:10px 5px}.fileItemBox[data-v-2c3b027c] :hover{background:#e2f6ff}",document.head.appendChild(e);import{r as a,f as t,o as i,u as l,g as s,c as n,b as d,a as o,t as c,F as r,w as p,d as u,p as f,e as v}from"./index.e2d55984.js";import{p as x}from"./Peer.36491284.js";import{s as S,a as h,b,T as g,F,r as y}from"./ReceiveFileList.12ac5cfc.js";var m={components:{EmptyFileList:S,SendFileList:h,ReceiveFileList:b},emits:["onSelectFiles","onRemoveFile","onDownloadFile"],setup(){l();const e=a(1),s=a([]),n=a([]),d=a([]),o=a(!0),c=a(0),r=a([]),p=t(()=>{let e=0;for(let a of n.value)e=a.size+e;return y(e)}),u=t(()=>{let e=0;for(let a of r.value)e+=a.byteLength;return e}),f=async(e,a)=>{await x.sendJson({type:e,payload:a})},v=e=>{if("string"==typeof e)S(e);else{let a=d.value.find(e=>e.id==c.value);r.value.push(e),a.precent=(u.value/a.size*100).toFixed(2)}},S=async e=>{const a=JSON.parse(e);if("TransferFileStart"===a.type){let e=d.value.find(e=>e.id==a.payload.id);c.value=a.payload.id,e.status="transfering"}else if("DownloadFile"==a.type)await(async e=>{let a=s.value.find(a=>a.id==e),t=n.value.find(a=>a.id==e);const i=new F(a);await x.sendJson({type:"TransferFileStart",payload:{id:e}}),t.status="transfering";let l=!1;for(;!l;){const e=await i.getNextChunk();l=e.done;const{chunk:a,offset:s}=e;try{t.precent=(s/t.size*100).toFixed(2),await x.send(a)}catch(e){console.log("传输错误："+e);break}}l&&(await x.sendJson({type:"TransferFileEnd",payload:{id:e}}),t.precent=100,t.status="success")})(a.payload.id);else if("TransferFileEnd"===a.type){let e=d.value.find(e=>e.id==a.payload.id);e.status="success",e.precent=100;const t=new Blob(r.value),i=document.createElement("a");i.href=window.URL.createObjectURL(t),i.download=e.name,i.click(),window.URL.revokeObjectURL(i.href)}else"AddFile"===a.type?d.value.push(a.payload):"DeleteFile"===a.type&&(d.value=d.value.filter(e=>e.id!=a.payload.id))};return i(async()=>{x.on("onReceiveMessage",v)}),{sendFileList:n,sendFileTotalSize:p,receiveFileList:d,isSendStatus:o,changeType:()=>{o.value=!o.value},onSelectFiles:async a=>{for(let t of a){t.id=e.value,t.precent=0,t.status="prepare";const a=new g(t);s.value.push(t),n.value.push(a),await f("AddFile",a),e.value++}},onChoseFile:()=>{document.getElementById("uploadFile").click()},onRemoveFile:async e=>{for(let a in n.value)if(e==n.value[a].id)return n.value.splice(a,1),s.value.splice(a,1),void await f("DeleteFile",{id:e})},onDownloadFile:async e=>{await x.sendJson({type:"DownloadFile",payload:{id:e}})},uid:e}}};const w=p("data-v-2c3b027c");f("data-v-2c3b027c");const C={class:"allBox flex_column"},k={class:"statusBox flex_column"},R={key:0,class:"fileBox flexAC"},L={key:0,class:"flex_column flexAC"},B={key:1,class:"flex_column"},O={key:1,class:"fileRemark flex",style:{width:"100%"}},T={key:2,class:"fileBox flexAC"},_={class:"flex_column"};v();const D=w((function(e,a,t,i,l,p){const f=s("EmptyFileList"),v=s("SendFileList"),x=s("ReceiveFileList");return u(),n(r,null,[d(" 框 "),o("div",{class:["flex flexAC",[i.isSendStatus?"SSB":"RSB"]],style:{height:"100vh"}},[o("div",C,[d(" 状态控制器 "),o("div",k,[o("div",{class:["SSClass",{active:i.isSendStatus}],onClick:a[1]||(a[1]=e=>i.changeType())},"发送端",2),o("div",{class:["RSClass",{active:!i.isSendStatus}],onClick:a[2]||(a[2]=e=>i.changeType()),style:{"margin-top":"10px"}},"接收端",2)]),d(" 文件显示框 "),i.isSendStatus?(u(),n("div",R,[0==i.sendFileList.length?(u(),n("div",L,[o(f,{onOnSelectFiles:i.onSelectFiles},null,8,["onOnSelectFiles"])])):(u(),n("div",B,[o(v,{files:i.sendFileList,onOnRemoveFile:i.onRemoveFile},null,8,["files","onOnRemoveFile"])]))])):d("v-if",!0),i.sendFileList.length>0&&i.isSendStatus?(u(),n("div",O,[d(" background: #555ab2 "),o("input",{type:"file",multiple:"",name:"uploadFile",id:"uploadFile",class:"uploadFile",style:{visibility:"hidden",position:"absolute",top:"0px",width:"0px"},onChange:a[3]||(a[3]=e=>i.onSelectFiles(e.target.files))},null,32),o("div",{style:{"font-weight":"bold","margin-left":"20px"},class:[i.isSendStatus?"SSCO":"RSCO"],onClick:a[4]||(a[4]=(...e)=>i.onChoseFile(...e))},"添加文件",2),o("div",{style:{"margin-left":"auto","margin-right":"20px"},class:[i.isSendStatus?"SSCO":"RSCO"]},c(i.sendFileList.length)+"个文件,共"+c(i.sendFileTotalSize),3)])):d("v-if",!0),i.isSendStatus?d("v-if",!0):(u(),n("div",T,[o("div",_,[o(x,{files:i.receiveFileList,onOnDownloadFile:i.onDownloadFile},null,8,["files","onOnDownloadFile"])])])),d(' <div style="width:100%" class="flex flexAC">\r\n        <div class="sendBtn" :class="[isSendStatus?\'SSC\':\'RSC\']">创建链接</div>\r\n      </div>')])],2)],64)}));m.render=D,m.__scopeId="data-v-2c3b027c",m.__file="src/views/Send.vue";export default m;