import numpy as np
import cv2
from typing import List
from moviepy.editor import VideoFileClip


def rectangle_inpaint(video_path: str, subtitle_regions: List[list], save_path: str):
    video = cv2.VideoCapture(video_path)
    fps = int(video.get(cv2.CAP_PROP_FPS))
    # count = int(video.get(cv2.CAP_PROP_FRAME_COUNT))
    size = (int(video.get(cv2.CAP_PROP_FRAME_WIDTH)), int(video.get(cv2.CAP_PROP_FRAME_HEIGHT)))

    mask = np.zeros((size[1], size[0]), np.uint8)
    for region in subtitle_regions:
        mask[int(region[1]):int(region[3]), int(region[0]):int(region[2])] = 255

    fourcc = cv2.VideoWriter_fourcc('H', '2', '6', '4')
    video_o = cv2.VideoWriter(save_path, fourcc, fps, size)

    while True:
        ret, frame = video.read()
        if ret:
            dst_TELEA = cv2.inpaint(frame, mask, 5, cv2.INPAINT_TELEA)
            # dst_NS = cv2.inpaint(frame, mask, 5, cv2.INPAINT_NS)
            video_o.write(dst_TELEA)
        else:
            break

    video.release()
    video_o.release()


def rectangle_inpaint_opt(video_path: str, subtitle_regions: List[list], save_path: str):
    video = VideoFileClip(video_path)
    
    mask = np.zeros((video.h, video.w), dtype=np.uint8)
    for region in subtitle_regions:
        mask[int(region[1]):int(region[3]), int(region[0]):int(region[2])] = 255

    def process_frame(frame):
        # Inpainting process
        return cv2.inpaint(frame, mask, 5, cv2.INPAINT_TELEA)

    # Apply the processing function to each frame
    processed_video = video.fl_image(process_frame)
    processed_video.write_videofile(save_path, codec="libx264", audio_codec="aac", temp_audiofile="temp_audio.aac", remove_temp=True)



def get_subtitle_mask_by_cv(image, regions: List[list]):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    _, thresh = cv2.threshold(gray, 245, 255, cv2.THRESH_BINARY)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))  
    dilated = cv2.dilate(thresh, kernel, iterations=2)
    mask = np.zeros_like(gray)
    for region in regions:
        x, y, w, h = region
        mask[y:y + h, x:x + w] = dilated[y:y + h, x:x + w]

    return mask


def get_subtitle_mask_by_ocr(image, region:list):
    # todo: use text segmentation
    pass

def dynamic_rectangle(image, region: list):
    # todo: optimize the text region by ocr detection
    pass

def text_inpaint(video_path: str, subtitle_regions: List[list], save_path: str):
    video = cv2.VideoCapture(video_path)

    fps = int(video.get(cv2.CAP_PROP_FPS))
    size = (int(video.get(cv2.CAP_PROP_FRAME_WIDTH)), int(video.get(cv2.CAP_PROP_FRAME_HEIGHT)))
    fourcc = cv2.VideoWriter_fourcc('D', 'I', 'V', 'X')
    video_o = cv2.VideoWriter(save_path, fourcc, fps, size)

    region_of_interest = (460, 965, 995, 57)  # x, y, 宽度, 高度

    while True:
        ret, frame = video.read()
        if ret:
            subtitle_mask = get_subtitle_mask_by_cv(frame, subtitle_regions)
            dst_TELEA = cv2.inpaint(frame, subtitle_mask, 5, cv2.INPAINT_TELEA)
            video_o.write(dst_TELEA)
        else:
            break

    video.release()
    video_o.release()