var canvas = document.getElementById('output');
var ctx = canvas.getContext('2d');

var x = 0;
var y = 0;

var xs = undefined;
var ys = undefined;

var training = true;
var model;

var scaleSize = 64;

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

    model = createModel();
    var $this = video; //cache
    (function loop() {
      if (!$this.paused && !$this.ended) {
        drawCanvas($this);
        if (training){
            x = Math.random();
            y = Math.random();
            count +=1;
            if(count % 50 ==0 || grace){
                
                if(grace == 50){
                    grace = 0;
                }
                else
                {
                    x = oldX;
                    y = oldY;
                    console.log((x*videoWidth)+" "+(y*videoWidth))
                    drawPoint(ctx, x*videoWidth, y*videoHeight, 10, 'red')
                    grace+= 1;
                    
                }
            }
            oldX = x;
            oldY = y;
            
            
        }else
        {
            output = predict();
            output.then(function (value)
            {
                x = value[0]
                y = value[1]
                console.log((x*videoWidth)+" "+(y*videoWidth))
                drawPoint(ctx, x*videoWidth, y*videoWidth, 10, 'red')
            })
            
            console.log(count)
        }
        setTimeout(loop, 30); // drawing at 30fps
      }
    })();
}

function addExample()
{
    const imgData = ctx.getImageData(0, 0, videoWidth, videoHeight);
    console.log((x*videoWidth)+" "+(y*videoWidth))
    input = preprocess(imgData)
    output = tf.tensor([x, y]).expandDims(0)

    if (xs == undefined)
    {
        xs = input;
        ys = output;
    }
    else{
        xs = xs.concat(input);
        ys = ys.concat(output);
    }
    console.log(xs.shape)
    console.log(ys.shape)
}

function preprocess(imgData)
{
    return tf.tidy(() => {
        //convert to a tensor 
        const tensor = tf.fromPixels(imgData).toFloat()

        //resize 
        const resized = tf.image.resizeBilinear(tensor, [scaleSize, scaleSize])
                
        //normalize 
        const offset = tf.scalar(255.0);
        const normalized = resized.div(offset)

        //We add a dimension to get a batch shape 
        const batched = normalized.expandDims(0)
        return batched
    })
}

async function train()
{
    const h = await model.fit(xs, ys, {batchSize:1, epochs:500});
    alert(h.history.loss[0])
    training = false;
    console.log('training')
}

async function predict()
{
    const imgData = ctx.getImageData(0, 0, videoWidth, videoHeight);
    const input = preprocess(imgData);
    const output = model.predict(input).dataSync();
    
    return output
}

function createModel()
{
    model = tf.sequential()
    model.add(tf.layers.conv2d({
        inputShape: [scaleSize,scaleSize,3],
        kernelSize: 3,
        filters: 16,
        padding: 'same',
    }))
    model.add(tf.layers.maxPooling2d({poolSize:2}))
    model.add(tf.layers.conv2d({
        kernelSize: 3,
        filters: 32,
        padding: 'same',
    }))
    
    model.add(tf.layers.maxPooling2d({poolSize:2}))
    model.add(tf.layers.flatten())
    model.add(tf.layers.dense({units:64, activation: 'relu'}))
    model.add(tf.layers.dense({units:2}))
    model.compile({optimizer: 'adam', loss: 'meanSquaredError', lr:0.01});
    return model
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