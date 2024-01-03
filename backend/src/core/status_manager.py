import os
import json


class StatusManager:
    def __init__(self, status_file="status.json", video_process_path="video_process", video_save_path="upload_videos"):
        self.video_save_path = video_save_path
        self.video_process_path = video_process_path
        self.status_file = status_file
        self.status = self.load_status()
        self.queeue = []

    def load_status(self):
        if os.path.exists(self.status_file):
            with open(self.status_file, 'r') as f:
                existed_status = json.load(f)
                processed_videos = os.listdir(self.video_process_path)
                key_name = [os.path.splitext(video)[0] for video in processed_videos]
                existed_status["Videos"] = dict(zip(key_name, processed_videos))
                return existed_status
        else:
            return {"Users": {}, "User2Videos": {}, "User2VideoProcess": {}, "VideosProcess": {}}

    def save_status(self):
        with open(self.status_file, 'w') as f:
            json.dump(self.status, f, indent=4)

    def updatae_status(self, bucket, key, value):
        self.status[bucket][key] = value
        self.save_status()

    def get_status(self, bucket, key):
        return self.status[bucket].get(key, None)
