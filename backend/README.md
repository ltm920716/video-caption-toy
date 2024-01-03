# python backend apis
**fastapi backend for Video Subtitle Wip**

## Supported Now
```static mode```： opencv inpaint     
```dynamic mode```：  STTN inpaint （need about 3G gpu memory by default）

## Build ENV
```
# python=3.8、cuda_11 for test
$ pip install -r requirements.txt

# install torch>1.0 from https://pytorch.org/ for dynamic mode 
$ pip install torch==1.7.0+cu110 torchvision==0.8.1+cu110 -f https://download.pytorch.org/whl/torch_stable.html
```

## Run
```
$ python app.py
```

## Attention！
dynamic wipe source code from：
https://github.com/a312863063/Video-Auto-Wipe

## Todo
- [ ] add user manager && video history
- [ ] add paddle-ocr for dynamic text detection
- [ ] integrate other applications for video, such as replace audio、replace subtitles



