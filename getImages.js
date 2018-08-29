var canvas = document.getElementById('output');
var ctx = canvas.getContext('2d');
var imgCount =0;

function isAndroid() {
  return /Android/i.test(navigator.userAgent);
}

function isiOS() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function isMobile() {
  return isAndroid() || isiOS();
}
      
const videoWidth = 500;
const videoHeight = 500;
const color = 'aqua';

async function setupCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert(
        'Browser API navigator.mediaDevices.getUserMedia not available');
  }

  const video = document.getElementById('video');

  const mobile = isMobile();
  try{
  const stream = await navigator.mediaDevices.getUserMedia({
    'audio': false,
    'video': {
      facingMode: 'user',
      width: mobile ? undefined : videoWidth,
      height: mobile ? undefined : videoHeight,
    },
  });
  
  video.srcObject = stream;
}catch(err){alert(err)}
  return new Promise((resolve) => {
    video.onloadedmetadata = () => {
      resolve(video);
    };
  });
}

async function loadVideo() {
  const video = await setupCamera();
  video.play();
  render();
  
}	   	    
function drawPoint(ctx, y, x, r, color) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
}

async function render()
{
    count = 0;
    grace = 0;
    let oldX;
    let oldY;
    var $this = video; //cache
    (function loop() {
      if (!$this.paused && !$this.ended) {
        drawCanvas($this);
        setTimeout(loop, 30); // drawing at 30fps
      }
    })();
}

function drawCanvas($this)
{
    ctx.clearRect(0, 0, videoWidth, videoHeight); 
    ctx.save();
    ctx.scale(-1, 1);
    ctx.translate(-videoWidth, 0);
    ctx.drawImage($this, 0, 0, videoWidth, videoHeight);
    ctx.restore();
}

function saveImage()
{

    // draw to canvas...
    canvas.toBlob(function(blob) {
        saveAs(blob, imgCount+".png");
        imgCount += 1;
    });
}