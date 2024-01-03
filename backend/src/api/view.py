from loguru import logger
import os
import sys

import asyncio
from concurrent.futures import ThreadPoolExecutor

from fastapi import APIRouter, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse

from .schema import SubtitleErase, GetStatus
from ..core.utils import make_unique_name
from ..core.cv_inpaint import rectangle_inpaint, rectangle_inpaint_opt
from ..core.sttn_inpaint import auto_wipe

router = APIRouter()

VIDEO_SAVE_PATH = os.path.join(os.path.dirname(
    os.path.dirname(__file__)), "upload_videos")
os.makedirs(VIDEO_SAVE_PATH, exist_ok=True)


async def process_queue(queue):
    global task_counter
    global task_dict
    while True:
        item = await queue.get()
        if item is None:
            # 退出循环
            break
        
        task_id = item['save_file_path']
        task_dict[task_id]['status'] = 'processing'

        logger.info(f"processing task: {task_id}")
        logger.info(f"task meta: {item}")

        try:
            file_path = os.path.join(VIDEO_SAVE_PATH, item['file_path'])
            save_file_path = os.path.join(VIDEO_SAVE_PATH, item['save_file_path'])
            if item['mode'] == 'static':
                # await asyncio.to_thread(rectangle_inpaint, file_path, item['regions'], save_file_path)
                # await asyncio.to_thread(rectangle_inpaint_opt, file_path, item['regions'], save_file_path)
                loop = asyncio.get_event_loop()
                with ThreadPoolExecutor() as pool:
                    await loop.run_in_executor(pool, rectangle_inpaint_opt, file_path, item['regions'], save_file_path)
            else:
                # await asyncio.to_thread(auto_wipe.wipe, file_path, item['regions'], save_file_path)
                loop = asyncio.get_event_loop()
                with ThreadPoolExecutor() as pool:
                    await loop.run_in_executor(pool, auto_wipe.wipe_opt, file_path, item['regions'], save_file_path)

            logger.info(f"subtitle_erase success: {task_id}")
            task_dict[task_id]['status'] = 'completed'
        except Exception as e:
            task_dict[task_id]['status'] = 'failed'
            msg = f"subtitle_erase error: {e}"
            logger.exception(msg)
        finally:
            for _, task_info in task_dict.items():
                task_info['index'] = max(task_info['index']-1, 0)
            task_counter -= 1
            logger.info(f"task_done: {task_id}")
            logger.info(task_dict)
            logger.info(task_counter)



task_queue = asyncio.Queue()
task_dict = {}
task_counter = 0
queue_processor = asyncio.create_task(process_queue(task_queue))


@router.post('/upload_video')
async def upload_video(file: UploadFile = File(...)):
    try:
        unique_filename = make_unique_name(file.filename)
        file_path = os.path.join(VIDEO_SAVE_PATH, unique_filename)

        with open(file_path, "wb") as f:
            f.write(file.file.read())

        logger.info(f"File saved successfully: {file_path}")

        return JSONResponse(content={'msg': 'success', 'data': unique_filename}, status_code=200)
    except Exception as e:
        msg = f"upload_video error: {e}"
        logger.exception(msg)
        return JSONResponse(content={'msg': msg, 'data': ''}, status_code=500)


@router.post('/subtitle_erase')
async def subtitle_erase(item: SubtitleErase):
    global task_counter
    global task_dict
    try:
        if item.mode == 'dynamic':
            assert auto_wipe is not None, "dynamic wipe is not available now"

        unique_filename = make_unique_name(item.file_path)

        params = {"mode": item.mode, "regions": item.regions, "file_path": item.file_path, "save_file_path": unique_filename}
        await task_queue.put(params)
        task_counter += 1
        
        task_dict[unique_filename] = {'task_id': unique_filename, 'file_path': item.file_path, 'status': 'queued', 'index': task_counter}

        logger.info(f"subtitle_erase task added: {unique_filename}-{task_counter}")
        logger.info(task_dict)

        return JSONResponse(content={'msg': 'success', 'data': {'task_id': unique_filename, 'status': 'queued'}}, status_code=200)
    except Exception as e:
        msg = f"subtitle_erase error: {e}"
        logger.exception(msg)
        return JSONResponse(content={'msg': msg, 'data': ''}, status_code=500)


@router.post('/status')
def get_status(item: GetStatus):
    global task_counter
    global task_dict
    try:
        task_id = item.task_id
        status = {
            "queue_num": task_counter,
            "index": task_dict[task_id]['index'],
            "status": task_dict[task_id]['status']
        }
        # logger.info(status)
        return JSONResponse(content={'msg': 'success', 'data': status}, status_code=200)
    except Exception as e:
        msg = f"get_status error: {e}"
        logger.exception(msg)
        return JSONResponse(content={'msg': msg, 'data': ''}, status_code=500)


@router.post('/get_video')
def get_video(item: GetStatus):
    try:
        logger.info(f"get_video: {item.task_id}")
        video_path = os.path.join(VIDEO_SAVE_PATH, item.task_id)
        return StreamingResponse(open(video_path, "rb"), media_type="video/mp4")
    except Exception as e:
        msg = f"get_video error: {e}"
        logger.exception(msg)
        raise HTTPException(status_code=404, detail="Video not found")
    

@router.get('/supported_mode_status')
def get_video():
    try:
        logger.info("get_mode")
        if auto_wipe is not None:
            data = {'static': True, 'dynamic': True}
        else:
            data = {'static': True, 'dynamic': False}
        return JSONResponse(content={'msg': 'success', 'data': data}, status_code=200)
    except Exception as e:
        msg = f"get_mode_status error: {e}"
        logger.exception(msg)
        return JSONResponse(content={'msg': msg, 'data': ''}, status_code=500)
