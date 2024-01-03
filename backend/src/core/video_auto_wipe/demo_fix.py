# -*- coding: utf-8 -*-
'''
Copyright: Copyright(c) 2018, seeprettyface.com, BUPT_GWY contributes the model.
Thanks to STTN provider: https://github.com/researchmm/STTN
Author: BUPT_GWY
Contact: a312863063@126.com
'''
import cv2
import numpy as np
import importlib
import sys
import torch
from torchvision import transforms
from loguru import logger
from typing import List

# My libs
from .core.utils import Stack, ToTorchFormatTensor
from moviepy.editor import ImageSequenceClip, AudioFileClip, concatenate_videoclips


_to_tensors = transforms.Compose([
    Stack(),
    ToTorchFormatTensor()])


def read_frame_info_from_video(vname):
    reader = cv2.VideoCapture(vname)
    if not reader.isOpened():
        logger.error("fail to open video")
        sys.exit(1)
    frame_info = {}
    frame_info['W_ori'] = int(reader.get(cv2.CAP_PROP_FRAME_WIDTH) + 0.5)
    frame_info['H_ori'] = int(reader.get(cv2.CAP_PROP_FRAME_HEIGHT) + 0.5)
    frame_info['fps'] = reader.get(cv2.CAP_PROP_FPS)
    frame_info['len'] = int(reader.get(cv2.CAP_PROP_FRAME_COUNT) + 0.5)
    return reader, frame_info


def read_mask(path):
    img = cv2.imread(path, 0)
    ret, img = cv2.threshold(img, 127, 1, cv2.THRESH_BINARY)
    img = img[:, :, None]
    return img


# sample reference frames from the whole video
def get_ref_index(neighbor_ids, length, ref_length):
    ref_index = []
    for i in range(0, length, ref_length):
        if not i in neighbor_ids:
            ref_index.append(i)
    return ref_index



def process(frames, model, device, w, h, neighbor_stride, ref_length):
    video_length = len(frames)
    feats = _to_tensors(frames).unsqueeze(0) * 2 - 1

    feats = feats.to(device)
    comp_frames = [None] * video_length

    with torch.no_grad():
        feats = model.encoder(feats.view(video_length, 3, h, w))
        _, c, feat_h, feat_w = feats.size()
        feats = feats.view(1, video_length, c, feat_h, feat_w)

    # completing holes by spatial-temporal transformers
    for f in range(0, video_length, neighbor_stride):
        neighbor_ids = [i for i in
                        range(max(0, f - neighbor_stride), min(video_length, f + neighbor_stride + 1))]
        ref_ids = get_ref_index(neighbor_ids, video_length, ref_length)
        with torch.no_grad():
            pred_feat = model.infer(
                feats[0, neighbor_ids + ref_ids, :, :, :])
            pred_img = torch.tanh(model.decoder(
                pred_feat[:len(neighbor_ids), :, :, :])).detach()
            pred_img = (pred_img + 1) / 2
            pred_img = pred_img.cpu().permute(0, 2, 3, 1).numpy() * 255
            for i in range(len(neighbor_ids)):
                idx = neighbor_ids[i]
                img = np.array(pred_img[i]).astype(
                    np.uint8)
                if comp_frames[idx] is None:
                    comp_frames[idx] = img
                else:
                    comp_frames[idx] = comp_frames[idx].astype(
                        np.float32) * 0.5 + img.astype(np.float32) * 0.5
    return comp_frames


def get_inpaint_mode_for_detext(H, h, mask):  # get inpaint segment
    mode = []
    to_H = from_H = H  # the subtitles are usually underneath
    while from_H != 0:
        if to_H - h < 0:
            from_H = 0
            to_H = h
        else:
            from_H = to_H - h
        if not np.all(mask[from_H:to_H, :] == 0) and np.sum(mask[from_H:to_H, :]) > 10:
            if to_H != H:
                move = 0
                while to_H + move < H and not np.all(mask[to_H + move, :] == 0):
                    move += 1
                if to_H + move < H and move < h:
                    to_H += move
                    from_H += move
            mode.append((from_H, to_H))
        to_H -= h
    return mode


class AutoWipe:
    def __init__(self, weight="src/core/video_auto_wipe/pretrained_weight/detext_trial.pth", device="cuda:0", gap=50, ref_length=5, neighbor_stride=5):
        device = torch.device(device)
        net = importlib.import_module('src.core.video_auto_wipe.model.auto-sttn')
        model = net.InpaintGenerator().to(device)
        data = torch.load(weight, map_location=device)
        model.load_state_dict(data['netG'])
        model.eval()

        self.model = model
        self.device = device
        self.clip_gap = gap
        self.ref_length = ref_length
        self.neighbor_stride = neighbor_stride
        self.w, self.h = 640, 120

    def wipe(self, video_path: str, subtitle_regions: List[list], save_path: str):
        reader, frame_info = read_frame_info_from_video(video_path)
        writer = cv2.VideoWriter(save_path, cv2.VideoWriter_fourcc('H', '2', '6', '4'), frame_info['fps'],
                                (frame_info['W_ori'], frame_info['H_ori']))

        rec_time = frame_info['len'] // self.clip_gap if frame_info['len'] % self.clip_gap == 0 else frame_info['len'] // self.clip_gap + 1
        # mask = read_mask(mask_path)
        mask = np.zeros((frame_info['H_ori'], frame_info['W_ori'], 1), np.uint8)
        for region in subtitle_regions:
            mask[int(region[1]):int(region[3]), int(region[0]):int(region[2])] = 1

        split_h = int(frame_info['W_ori'] * 3 / 16)
        mode = get_inpaint_mode_for_detext(frame_info['H_ori'], split_h, mask)

        for i in range(rec_time):
            start_f = i * self.clip_gap
            end_f = min((i + 1) * self.clip_gap, frame_info['len'])
            logger.info(f"Processing: {start_f + 1} - {end_f}  / Total: {frame_info['len']}")

            frames_hr = []
            frames = {}
            comps = {}
            for k in range(len(mode)):
                frames[k] = []
            for j in range(start_f, end_f):
                success, image = reader.read()
                frames_hr.append(image)
                for k in range(len(mode)):
                    image_crop = image[mode[k][0]:mode[k][1], :, :]
                    image_resize = cv2.resize(image_crop, (self.w, self.h))
                    frames[k].append(image_resize)

            for k in range(len(mode)):
                comps[k] = process(frames[k], self.model, self.device, self.w, self.h, self.neighbor_stride, self.ref_length)

            if mode is not []:
                for j in range(end_f - start_f):
                    frame = frames_hr[j]
                    for k in range(len(mode)):
                        comp = cv2.resize(comps[k][j], (frame_info['W_ori'], split_h))
                        comp = cv2.cvtColor(np.array(comp).astype(np.uint8), cv2.COLOR_BGR2RGB)
                        mask_area = mask[mode[k][0]:mode[k][1], :]
                        frame[mode[k][0]:mode[k][1], :, :] = mask_area * comp + (1 - mask_area) * frame[
                                                                                                mode[k][0]:mode[k][1], :,
                                                                                                :]
                    writer.write(frame)

        writer.release()

    def wipe_opt(self, video_path: str, subtitle_regions: List[list], save_path: str):
        reader, frame_info = read_frame_info_from_video(video_path)

        rec_time = frame_info['len'] // self.clip_gap if frame_info['len'] % self.clip_gap == 0 else frame_info['len'] // self.clip_gap + 1
        # mask = read_mask(mask_path)
        mask = np.zeros((frame_info['H_ori'], frame_info['W_ori'], 1), np.uint8)
        for region in subtitle_regions:
            mask[int(region[1]):int(region[3]), int(region[0]):int(region[2])] = 1

        split_h = int(frame_info['W_ori'] * 3 / 16)
        mode = get_inpaint_mode_for_detext(frame_info['H_ori'], split_h, mask)

        processed_clips = []
        logger.info(f'Total clips: {rec_time}')
        for i in range(rec_time):
            start_f = i * self.clip_gap
            end_f = min((i + 1) * self.clip_gap, frame_info['len'])
            logger.info(f"Processing: {start_f + 1} - {end_f}  / Total: {frame_info['len']}")

            frames_hr = []
            frames = {}
            comps = {}
            for k in range(len(mode)):
                frames[k] = []
            for j in range(start_f, end_f):
                success, image = reader.read()
                frames_hr.append(image)
                for k in range(len(mode)):
                    image_crop = image[mode[k][0]:mode[k][1], :, :]
                    image_resize = cv2.resize(image_crop, (self.w, self.h))
                    frames[k].append(image_resize)

            for k in range(len(mode)):
                comps[k] = process(frames[k], self.model, self.device, self.w, self.h, self.neighbor_stride, self.ref_length)

            processed_frames = []
            if mode is not []:
                for j in range(end_f - start_f):
                    frame = frames_hr[j]
                    for k in range(len(mode)):
                        comp = cv2.resize(comps[k][j], (frame_info['W_ori'], split_h))
                        comp = cv2.cvtColor(np.array(comp).astype(np.uint8), cv2.COLOR_RGB2BGR)
                        mask_area = mask[mode[k][0]:mode[k][1], :]
                        frame[mode[k][0]:mode[k][1], :, :] = mask_area * comp + (1 - mask_area) * frame[
                                                                                                mode[k][0]:mode[k][1], :,
                                                                                                :]
                    processed_frames.append(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))

            processed_clip = ImageSequenceClip(processed_frames, fps=int(frame_info['fps']))
            processed_clips.append(processed_clip)

        final_clip = concatenate_videoclips(processed_clips)

        audio_clip = AudioFileClip(video_path)
        final_clip = final_clip.set_audio(audio_clip)

        final_clip.write_videofile(save_path, codec="libx264", audio_codec="aac", temp_audiofile="temp_audio.aac", remove_temp=True)

