//@ts-check
///<reference path="./waitForElement.js" />
var /** @type {(...args)=>HTMLElement}*/ put = eval("window['put']");

const _WaveSurfer = waitFor(() => window["WaveSurfer"]);

const putStyle = (style, ...args)=>{
  const root = args.length?put(...args):put('div');
  for(let key in style){
    root.style[key] = style[key];
  }
  return root;
}

document.body.append(put('style', `
.filesDropArea {
  border: 5px solid blue;
  width: 80vw;
  height: 50vh;
  margin: auto;
  text-align: center;
  margin-top: 5em;
}
.filesDropArea.hover {
  border-color: green;
}
.hidden {
  display: none;
}
.buttons-hidden button {
  display: none;
}
button{
  margin:0.1em;
  padding:0.1em;
}
#waveform {
  margin-bottom:2em;
}
.button-bar{
  margin-top:1em;
  margin-bottom:1em;
  display:flex;
  flex-direction: row;
  justify-content: space-around;
}
.global-view .detail-group{
  display: none;
}
.global-group{
  display: none;
}
.global-view .global-group{
  display: block;
}
.buttons-hidden .text-bar{
  display: none;
}

.text-bar{
  text-align: center;
  width: 100%;
  margin-top: 0.3em;
  margin-bottom: 0.3em;
}
.tab-bar{
  overflow: hidden;
  border: 1px solid #ccc;
  background-color: #f1f1f1;
}
.tab-bar button {
  background-color: inherit;
  float: left;
  border: none;
  outline: none;
  cursor: pointer;
  padding: 14px 16px;
  transition: 0.3s;
}
.tab-bar button:hover {
  background-color: #ddd;
}
.tab-bar button.active {
  background-color: #ccc;
}
`));
const mainContent = (() => {
  const fileInput = put('input[type="file"]');
  const exampleInput = put('p $ a[href="javascript:void"] $ < $', 'Or load ', 'this example', '.');
  exampleInput.onclick = ()=>{
    devSimulateFileDrop();
  }
  const fileDropArea = put('div.filesDropArea', [
    put('p $ i $ < $', 'Drag an mp3 file into this ', 'drop zone', '.', [
      putStyle({marginTop: '2em'}),
      fileInput,
      putStyle({marginTop: '7em'}),
      exampleInput,
    ]),
  ])
  fileDropArea.ondragover = (ev) => {
    ev.preventDefault();
    put(fileDropArea, '.hover');
  };
  fileDropArea.ondragleave = (ev) => {
    ev.preventDefault();
    if (!fileDropArea.classList.contains('hidden'))
      put(fileDropArea, '!hover');
  };
  fileInput.oninput = (ev)=>{
    ev.preventDefault();
    put(fileDropArea, '!hover');
    //@ts-ignore
    const file = fileInput.files[0];
    if (file) onFile(file);
  };

  fileDropArea.ondrop = (ev) => {
    ev.preventDefault();
    put(fileDropArea, '!.hover');
    const file = [...(ev.dataTransfer?.files || [])][0];
    if (file) onFile(file);
  }
  async function onFile(file){
    put(fileDropArea, '.hidden');
    try{
      await onDropFile(file);
    } catch(err) {
      put(fileDropArea, '!hidden');
      window.alert(err);
    }
  }

  async function fileToBlob(file) {
    const data = await new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = (evt) => resolve(
        /**@type {*}*/(evt.target?.result),
      );
      reader.readAsArrayBuffer(file);
    });
    const dataArr = new Uint8Array(data);
    return new window.Blob([dataArr]);
  }

  async function onDropFile(file) {
    const blob = await fileToBlob(file);
    return await waveSurferLoad(blob, file.name);
  }

  function waveSurferLoadBlob(blob) {
    return new Promise(async (resolve, reject) => {
      const waveSurfer = await _waveSurfer;
      waveSurfer.on('error', reject);
      waveSurfer.loadBlob(blob);
      await waitFor(() => waveSurfer.getDuration() > 0);
      resolve(waveSurfer);
    })
  }

  async function waveSurferLoad(blob, filename) {
    const waveSurfer = await waveSurferLoadBlob(blob);
    const duration = waveSurfer.getDuration();
    //http://wavesurfer-js.org/plugins/regions.html
    const region = waveSurfer.addRegion({
      start: 0.25 * duration,
      end: 0.75 * duration,
      color: '#00ccaa44',
      drag: false,
    });
    const zoom0 = window.innerWidth * 0.0025 * duration * 0.005;
    const zoom1 = 45;
    waveSurfer.zoom(zoom0);
    zoomIn.onclick = () => {
      waveSurfer.zoom(zoom1);
      put(parent, '!global-view');
      put(zoomIn, '.active');
      put(zoomOut, '!active');
    }
    zoomOut.onclick = () => {
      waveSurfer.zoom(zoom0);
      put(parent, '.global-view');
      put(zoomIn, '!active');
      put(zoomOut, '.active');
    }
    playStart.onclick = async () => {
      waveSurfer.setCursorColor('#000000ff');
      setTimeout(() => waveSurfer.setCursorColor('#00000000'), 3000);
      waveSurfer.play(region.start, region.start + 3);
    }
    playEnd.onclick = async () => {
      waveSurfer.setCursorColor('#000000ff');
      setTimeout(() => waveSurfer.setCursorColor('#00000000'), 3000);
      waveSurfer.play(region.end - 3, region.end);
    }
    seekStart.onclick = async () => {
      const pos = region.start / duration;
      waveSurfer.seekAndCenter(pos);
    }
    seekEnd.onclick = async () => {
      const pos = region.end / duration;
      waveSurfer.seekAndCenter(pos);
    }
    download.onclick = async () => {
      put(parent, '.buttons-hidden');
      put(processing, '!hidden');
      const outBlob = await trim(blob, region.start, region.end);
      downloadBlob(outBlob, filename);
      put(processing, '.hidden');
      put(parent, '!buttons-hidden');
    }
    put(parent, '!buttons-hidden');
    zoomOut.click(); // Just for active tab style

    region.on('update-end', () => {
      // WaveSurfer issue 1878
      document.querySelector("body")?.click();
    });
  };

  async function trim(blob, start, end) {
    const cutBlob = await new Promise(resolve => {
      //@ts-ignore
      let cutter = new mp3cutter();
      cutter.cut(blob, start, end, resolve);
    })
    //@ts-ignore
    const mp3tag = new MP3Tag(await blob.arrayBuffer());
    mp3tag.read();
    mp3tag.buffer = await cutBlob.arrayBuffer();
    return new window.Blob([mp3tag.save()]);
  }
  function downloadBlob(blob, filename) {
    const url = window.URL || window.webkitURL;
    const link = url.createObjectURL(blob);
    const a = put("a.hidden");
    a.setAttribute("download", filename);
    a.setAttribute("href", link);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  async function devSimulateFileDrop() {
    await sleep(100);
    put(fileDropArea, '.hidden');
    const filename = 'Dueto de antaño - Las acacias.mp3';
    const req = new Request(`./examples/${filename}`);
    const blob = await (await fetch(req)).blob();
    waveSurferLoad(blob, filename);
  }

  const _waveSurfer = (async () => {
    const WaveSurfer = await _WaveSurfer;
    await waitForElement('#waveform');
    const waveSurfer = WaveSurfer.create({
      container: '#waveform',
      waveColor: 'violet',
      progressColor: '#00000000',
      cursorColor: '#00000000',
      //scrollParent: true,
      interact: false,
      plugins: [
        WaveSurfer.regions.create({})
      ]
    });
    //devSimulateFileDrop();
    return waveSurfer;
  })();

  const playStart = put('button $', 'Play head');
  const seekStart = put('button $', 'Seek head');
  const playEnd = put('button $', 'Play tail');
  const seekEnd = put('button $', 'Seek tail');
  const zoomOut = put('button.active $', 'Global view');
  const zoomIn = put('button $', 'Detailed view');
  const download = put('button $', 'Download');
  const processing = put('div.hidden $', 'processing...');
  const parent = put('div.buttons-hidden.global-view', [
    putStyle({paddingTop: '0.01em'}),
    fileDropArea,
    put('div.tab-bar', [zoomOut, zoomIn]),
    put('div.button-bar.detail-group', [seekStart, seekEnd]),
    put('div.text-bar.global-group $', '1. Quickly set approximate head and tail positions'),
    put('div#waveform'),
    put('div.button-bar', [playStart, playEnd]),
    put('div.text-bar.global-group $', '2. Go to detailed view and tune'),
    put('div.text-bar $', '3. Download'),
    put('div.button-bar', [download]),
    processing,
  ]);
  parent.style.paddingBottom = '0.5em';

  parent.append(
    putStyle({marginTop: '10em'}),
    put('hr'),
    put('p $', 'Developed by Carlos Pinzón @caph1993 using these tools:'),
    put('ul', [
      put('li a[href=$] $ <', 'http://wavesurfer-js.org/', 'waveSurfer.js'),
      put('li a[href=$] $ <', 'https://mp3tag.js.org/', 'mp3tags.js'),
      put('li a[href=$] $ <', 'https://github.com/lubenard/simple-mp3-cutter', 'simple-mp3-cutter.js'),
      put('li a[href=$] $ <', 'https://github.com/higuma/mp3-lame-encoder-js', 'mp3-lame-encoder.js'),
      put('li a[href=$] $ <', 'https://github.com/kriszyp/put-selector', 'put-selector.js'),
      put('li a[href=$] $ <', 'https://icons8.com/', 'icons8.com'),
    ])
  )
  return parent;
})();


customElements.define('new-main', class extends HTMLElement {
  constructor() {
    super();
    this.append(mainContent);
  }
})